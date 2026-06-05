import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import GoogleMapPicker from '../components/page/GoogleMapPicker'

const googleMapMocks = vi.hoisted(() => ({
  isLoaded: true,
}))

vi.mock('@react-google-maps/api', () => ({
  useJsApiLoader: vi.fn(() => ({
    isLoaded: googleMapMocks.isLoaded,
  })),

  GoogleMap: ({ children, onClick, center, zoom }: any) => (
    <div>
      <button
        type="button"
        data-testid="google-map"
        data-center={JSON.stringify(center)}
        data-zoom={String(zoom)}
        onClick={() =>
          onClick?.({
            latLng: {
              lat: () => -1.25,
              lng: () => -78.62,
            },
          })
        }
      >
        Google Map Mock
      </button>
      {children}
    </div>
  ),

  Marker: ({ position, label }: any) => (
    <div data-testid="marker">
      {label ?? 'marker'}:{position.lat},{position.lng}
    </div>
  ),

  DirectionsRenderer: ({ directions }: any) => (
    <div data-testid="directions-renderer">
      {directions?.route ?? 'directions'}
    </div>
  ),
}))

const setupGoogleMock = () => {
  ;(globalThis as any).google = {
    maps: {
      Geocoder: class {
        geocode(_: any, callback: any) {
          callback(
            [
              {
                formatted_address: 'Centro, Ambato, Ecuador',
                address_components: [
                  {
                    long_name: 'Centro',
                    types: ['neighborhood'],
                  },
                ],
              },
            ],
            'OK'
          )
        }
      },

      DirectionsService: class {
        route(_: any, callback: any) {
          callback(
            {
              route: 'ruta-calculada',
            },
            'OK'
          )
        }
      },

      DistanceMatrixService: class {
        getDistanceMatrix(_: any, callback: any) {
          callback(
            {
              rows: [
                {
                  elements: [
                    {
                      status: 'OK',
                      duration: { text: '5 min' },
                      distance: { text: '1 km' },
                    },
                    {
                      status: 'OK',
                      duration: { text: '12 min' },
                      distance: { text: '4 km' },
                    },
                  ],
                },
              ],
            },
            'OK'
          )
        }
      },

      TravelMode: {
        DRIVING: 'DRIVING',
      },

      DirectionsStatus: {
        OK: 'OK',
      },

      Size: class {
        width: number
        height: number

        constructor(width: number, height: number) {
          this.width = width
          this.height = height
        }
      },

      Point: class {
        x: number
        y: number

        constructor(x: number, y: number) {
          this.x = x
          this.y = y
        }
      },
    },
  }
}

describe('GoogleMapPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    googleMapMocks.isLoaded = true
    setupGoogleMock()
  })

it('debe mostrar coordenadas iniciales en fallback', () => {
  vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')

  const { container } = render(
    <GoogleMapPicker
      initialOrigin={{ lat: -1.24908, lng: -78.61675 }}
      initialDestination={{ lat: -1.26001, lng: -78.62002 }}
    />
  )

  expect(screen.getByText('Origen')).toBeInTheDocument()
  expect(screen.getByText('Destino')).toBeInTheDocument()

  expect(container).toHaveTextContent('-1.2491')
  expect(container).toHaveTextContent('-78.6167')

  expect(container).toHaveTextContent('-1.2600')
  expect(container).toHaveTextContent('-78.6200')
})
  it('debe mostrar fallback en modo solo lectura', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')

    render(<GoogleMapPicker readOnly />)

    expect(screen.getByText('Ruta registrada')).toBeInTheDocument()
    expect(
      screen.getByText('La ruta se conserva con los datos del viaje.')
    ).toBeInTheDocument()
  })

  it('debe mostrar coordenadas iniciales en fallback', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')

    render(
      <GoogleMapPicker
        initialOrigin={{ lat: -1.24908, lng: -78.61675 }}
        initialDestination={{ lat: -1.26001, lng: -78.62002 }}
      />
    )

    expect(screen.getByText('Origen')).toBeInTheDocument()

    expect(screen.getByText('Destino')).toBeInTheDocument()
    expect(screen.getByText('-1.2600, -78.6200')).toBeInTheDocument()
  })

  it('debe mostrar cargando mapa cuando la API aún no está cargada', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')
    googleMapMocks.isLoaded = false

    render(<GoogleMapPicker />)

    expect(screen.getByText('Cargando mapa...')).toBeInTheDocument()
  })

  it('debe renderizar el mapa cuando la API está cargada', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(<GoogleMapPicker />)

    expect(screen.getByTestId('google-map')).toBeInTheDocument()
    expect(
      screen.getByText('Haz clic para seleccionar el PUNTO DE ORIGEN')
    ).toBeInTheDocument()
  })

  it('debe seleccionar origen al hacer clic en el mapa', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onOriginChange = vi.fn()

    render(<GoogleMapPicker onOriginChange={onOriginChange} />)

    fireEvent.click(screen.getByTestId('google-map'))

    await waitFor(() => {
      expect(onOriginChange).toHaveBeenCalledWith(
        {
          lat: -1.25,
          lng: -78.62,
        },
        'Centro'
      )
    })

    expect(screen.getByText('O:-1.25,-78.62')).toBeInTheDocument()
  })

  it('debe seleccionar destino cuando ya existe origen inicial', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onDestinationChange = vi.fn()

    render(
      <GoogleMapPicker
        initialOrigin={{ lat: -1.24908, lng: -78.61675 }}
        onDestinationChange={onDestinationChange}
      />
    )

    expect(
      screen.getByText('Haz clic para seleccionar el PUNTO DE DESTINO')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('google-map'))

    await waitFor(() => {
      expect(onDestinationChange).toHaveBeenCalledWith(
        {
          lat: -1.25,
          lng: -78.62,
        },
        'Centro'
      )
    })

    expect(screen.getByText('D:-1.25,-78.62')).toBeInTheDocument()
  })

  it('debe reiniciar ruta cuando ya existe origen y destino', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onOriginChange = vi.fn()

    render(
      <GoogleMapPicker
        initialOrigin={{ lat: -1.24908, lng: -78.61675 }}
        initialDestination={{ lat: -1.26001, lng: -78.62002 }}
        onOriginChange={onOriginChange}
      />
    )

    expect(screen.getByText('Ruta seleccionada (haz clic para reiniciar)')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('google-map'))

    await waitFor(() => {
      expect(onOriginChange).toHaveBeenCalledWith(
        {
          lat: -1.25,
          lng: -78.62,
        },
        'Centro'
      )
    })

    expect(screen.getByText('Haz clic para seleccionar el PUNTO DE DESTINO')).toBeInTheDocument()
  })

  it('no debe seleccionar puntos cuando readOnly es true', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onOriginChange = vi.fn()

    render(<GoogleMapPicker readOnly onOriginChange={onOriginChange} />)

    expect(screen.getByText('Seguimiento en tiempo real')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('google-map'))

    expect(onOriginChange).not.toHaveBeenCalled()
  })

  it('debe renderizar marcadores de conductor y pasajero', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(
      <GoogleMapPicker
        driverLocation={{ lat: -1.24, lng: -78.61 }}
        passengerLocation={{ lat: -1.25, lng: -78.62 }}
      />
    )

    expect(screen.getByText('marker:-1.24,-78.61')).toBeInTheDocument()
    expect(screen.getByText('Tú:-1.25,-78.62')).toBeInTheDocument()
  })

  it('debe calcular ETA hacia pasajero y destino', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onEtaChange = vi.fn()

    render(
      <GoogleMapPicker
        driverLocation={{ lat: -1.24, lng: -78.61 }}
        passengerLocation={{ lat: -1.25, lng: -78.62 }}
        initialDestination={{ lat: -1.26, lng: -78.63 }}
        onEtaChange={onEtaChange}
      />
    )

    await waitFor(() => {
      expect(onEtaChange).toHaveBeenCalledWith({
        toPassenger: {
          duration: '5 min',
          distance: '1 km',
        },
        toDestination: {
          duration: '12 min',
          distance: '4 km',
        },
      })
    })
  })

  it('debe calcular ETA solo hacia destino cuando no hay pasajero', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    const onEtaChange = vi.fn()

    render(
      <GoogleMapPicker
        driverLocation={{ lat: -1.24, lng: -78.61 }}
        initialDestination={{ lat: -1.26, lng: -78.63 }}
        onEtaChange={onEtaChange}
      />
    )

    await waitFor(() => {
      expect(onEtaChange).toHaveBeenCalledWith({
        toDestination: {
          duration: '5 min',
          distance: '1 km',
        },
      })
    })
  })

  it('debe renderizar DirectionsRenderer cuando existe ruta', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(
      <GoogleMapPicker
        initialOrigin={{ lat: -1.24908, lng: -78.61675 }}
        initialDestination={{ lat: -1.26001, lng: -78.62002 }}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('directions-renderer')).toBeInTheDocument()
    })

    expect(screen.getByText('ruta-calculada')).toBeInTheDocument()
  })

  it('debe centrar mapa en driverLocation cuando existe', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(
      <GoogleMapPicker
        driverLocation={{ lat: -1.24, lng: -78.61 }}
        passengerLocation={{ lat: -1.25, lng: -78.62 }}
      />
    )

    expect(screen.getByTestId('google-map')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: -1.24, lng: -78.61 })
    )
  })

  it('debe centrar mapa en passengerLocation cuando no existe driverLocation', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(<GoogleMapPicker passengerLocation={{ lat: -1.25, lng: -78.62 }} />)

    expect(screen.getByTestId('google-map')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: -1.25, lng: -78.62 })
    )
  })

  it('debe centrar mapa en origen cuando no hay conductor ni pasajero', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'google-key-test')

    render(<GoogleMapPicker initialOrigin={{ lat: -1.24908, lng: -78.61675 }} />)

    expect(screen.getByTestId('google-map')).toHaveAttribute(
      'data-center',
      JSON.stringify({ lat: -1.24908, lng: -78.61675 })
    )
  })
})