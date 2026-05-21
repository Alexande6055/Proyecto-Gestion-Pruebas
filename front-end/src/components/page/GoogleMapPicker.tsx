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

function MapFallback({
  initialOrigin,
  initialDestination,
  readOnly,
}: Pick<GoogleMapPickerProps, 'initialOrigin' | 'initialDestination' | 'readOnly'>) {
  return (
    <div className="h-[400px] rounded-lg border border-night-200 bg-night-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm space-y-3 text-center">
        <div className="w-10 h-10 mx-auto rounded-uride-xs bg-uride-100 flex items-center justify-center">
          <span className="text-sm font-bold text-uride-700">GPS</span>
        </div>
        <p className="text-sm font-semibold text-night-800">
          {readOnly ? 'Ruta registrada' : 'Mapa no configurado'}
        </p>
        <p className="text-xs text-night-500 leading-relaxed">
          {readOnly
            ? 'La ruta se conserva con los datos del viaje.'
            : 'Puedes continuar usando los campos de origen y destino.'}
        </p>
        {(initialOrigin || initialDestination) && (
          <div className="grid grid-cols-1 gap-2 text-left">
            {initialOrigin && (
              <div className="bg-white border border-night-100 rounded-uride-xs p-3">
                <span className="text-[10px] font-bold text-night-400 uppercase">Origen</span>
                <p className="text-xs font-semibold text-night-700">{initialOrigin.lat.toFixed(4)}, {initialOrigin.lng.toFixed(4)}</p>
              </div>
            )}
            {initialDestination && (
              <div className="bg-white border border-night-100 rounded-uride-xs p-3">
                <span className="text-[10px] font-bold text-night-400 uppercase">Destino</span>
                <p className="text-xs font-semibold text-night-700">{initialDestination.lat.toFixed(4)}, {initialDestination.lng.toFixed(4)}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const GoogleMapPickerInner: React.FC<GoogleMapPickerProps & { apiKey: string }> = ({
  onOriginChange,
  onDestinationChange,
  onEtaChange,
  initialOrigin,
  initialDestination,
  driverLocation,
  passengerLocation,
  readOnly = false,
  apiKey,
}) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey
  });

  const [origin, setOrigin] = useState<Location | null>(initialOrigin || null);
  const [destination, setDestination] = useState<Location | null>(initialDestination || null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const geocoder = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded && !geocoder.current) {
      geocoder.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

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

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  if (!apiKey) {
    return (
      <MapFallback
        initialOrigin={props.initialOrigin}
        initialDestination={props.initialDestination}
        readOnly={props.readOnly}
      />
    );
  }

  return <GoogleMapPickerInner {...props} apiKey={apiKey} />;
};

export default React.memo(GoogleMapPicker);
