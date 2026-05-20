import React, { useCallback, useRef, useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const center = {
  lat: -1.24908,
  lng: -78.61675
};

interface Location {
  lat: number;
  lng: number;
}

interface EtaInfo {
  duration: string;
  distance: string;
}

interface GoogleMapPickerProps {
  onOriginChange?: (location: Location, address?: string) => void;
  onDestinationChange?: (location: Location, address?: string) => void;
  onEtaChange?: (eta: { toPassenger?: EtaInfo; toDestination?: EtaInfo }) => void;
  initialOrigin?: Location | null;
  initialDestination?: Location | null;
  driverLocation?: Location | null;
  passengerLocation?: Location | null;
  readOnly?: boolean;
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  onOriginChange,
  onDestinationChange,
  onEtaChange,
  initialOrigin,
  initialDestination,
  driverLocation,
  passengerLocation,
  readOnly = false
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [origin, setOrigin] = useState<Location | null>(initialOrigin || null);
  const [destination, setDestination] = useState<Location | null>(initialDestination || null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded && !geocoder.current) {
      geocoder.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (initialOrigin) setOrigin(initialOrigin);
    if (initialDestination) setDestination(initialDestination);
  }, [initialOrigin, initialDestination]);

  const calculateRoute = useCallback(() => {
    if (!origin || !destination || !isLoaded) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        }
      }
    );
  }, [origin, destination, isLoaded]);

  // Calculate ETAs
  useEffect(() => {
    if (!isLoaded || !driverLocation) return;

    const service = new google.maps.DistanceMatrixService();
    const destinations: google.maps.LatLngLiteral[] = [];
    
    if (passengerLocation) destinations.push(passengerLocation);
    if (destination) destinations.push(destination);

    if (destinations.length === 0) return;

    service.getDistanceMatrix(
      {
        origins: [driverLocation],
        destinations: destinations,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const results = response.rows[0].elements;
          const eta: { toPassenger?: EtaInfo; toDestination?: EtaInfo } = {};
          
          if (passengerLocation && results[0].status === 'OK') {
            eta.toPassenger = {
              duration: results[0].duration.text,
              distance: results[0].distance.text,
            };
          }
          
          const destIdx = passengerLocation ? 1 : 0;
          if (destination && results[destIdx]?.status === 'OK') {
            eta.toDestination = {
              duration: results[destIdx].duration.text,
              distance: results[destIdx].distance.text,
            };
          }
          
          onEtaChange?.(eta);
        }
      }
    );
  }, [isLoaded, driverLocation, passengerLocation, destination, onEtaChange]);

  useEffect(() => {
    if (origin && destination) {
      calculateRoute();
    } else {
      setDirections(null);
    }
  }, [origin, destination, calculateRoute]);

  const reverseGeocode = (lat: number, lng: number, callback: (address: string) => void) => {
    if (!geocoder.current) return;

    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        const neighborhood = results[0].address_components.find(c => 
          c.types.includes('neighborhood') || c.types.includes('sublocality')
        );
        callback(neighborhood ? neighborhood.long_name : address.split(',')[0]);
      }
    });
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (readOnly || !e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const newLoc = { lat, lng };

    if (!origin) {
      setOrigin(newLoc);
      reverseGeocode(lat, lng, (address) => onOriginChange?.(newLoc, address));
    } else if (!destination) {
      setDestination(newLoc);
      reverseGeocode(lat, lng, (address) => onDestinationChange?.(newLoc, address));
    } else {
      setOrigin(newLoc);
      setDestination(null);
      setDirections(null);
      reverseGeocode(lat, lng, (address) => onOriginChange?.(newLoc, address));
    }
  }, [origin, destination, onOriginChange, onDestinationChange, readOnly]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!isLoaded) return <div>Cargando mapa...</div>;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-1">
        {readOnly ? 'Seguimiento en tiempo real' : (
          !origin ? 'Haz clic para seleccionar el PUNTO DE ORIGEN' : 
          !destination ? 'Haz clic para seleccionar el PUNTO DE DESTINO' : 
          'Ruta seleccionada (haz clic para reiniciar)'
        )}
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={driverLocation || passengerLocation || origin || center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {origin && <Marker position={origin} label="O" />}
        {destination && <Marker position={destination} label="D" />}
        
        {driverLocation && (
          <Marker 
            position={driverLocation} 
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/car.png',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20)
            }}
            zIndex={100}
          />
        )}

        {passengerLocation && (
          <Marker 
            position={passengerLocation} 
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/man.png',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32)
            }}
            label="Tú"
          />
        )}

        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.7
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default React.memo(GoogleMapPicker);
