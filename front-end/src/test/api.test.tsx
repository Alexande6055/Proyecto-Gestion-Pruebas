import { beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeBackendRow, normalizeRows, requestJson } from '../services/api'

const createLocalStorageMock = () => {
    let store: Record<string, string> = {}

    return {
        getItem: vi.fn((key: string) => store[key] ?? null),

        setItem: vi.fn((key: string, value: string) => {
            store[key] = String(value)
        }),

        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),

        clear: vi.fn(() => {
            store = {}
        }),

        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),

        get length() {
            return Object.keys(store).length
        },
    }
}

const createResponse = ({
    ok = true,
    status = 200,
    text = '',
    contentType = 'application/json',
}: {
    ok?: boolean
    status?: number
    text?: string
    contentType?: string
}) => ({
    ok,
    status,
    text: vi.fn().mockResolvedValue(text),
    headers: {
        get: vi.fn((key: string) => {
            if (key.toLowerCase() === 'content-type') return contentType
            return null
        }),
    },
})

describe('api.ts', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        const localStorageMock = createLocalStorageMock()

        Object.defineProperty(globalThis, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true,
        })

        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
            configurable: true,
        })

        vi.stubGlobal('fetch', vi.fn())
    })

    describe('requestJson', () => {
        it('debe hacer una petición GET y devolver JSON', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ message: 'ok' }),
                }) as unknown as Response,
            )

            const result = await requestJson<{ message: string }>('/test')

            expect(result).toEqual({ message: 'ok' })
            expect(fetch).toHaveBeenCalledTimes(1)
        })

        it('debe agregar Content-Type application/json por defecto', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('/test')

            const [, options] = vi.mocked(fetch).mock.calls[0]
            const headers = options?.headers as Headers

            expect(headers.get('Content-Type')).toBe('application/json')
        })

        it('debe agregar Authorization si existe access_token en localStorage', async () => {
            localStorage.setItem(
                'uride-session-storage-v2',
                JSON.stringify({
                    state: {
                        session: {
                            access_token: 'token-test',
                        },
                    },
                }),
            )

            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('/profile')

            const [, options] = vi.mocked(fetch).mock.calls[0]
            const headers = options?.headers as Headers

            expect(headers.get('Authorization')).toBe('Bearer token-test')
        })

        it('no debe reemplazar Authorization si ya viene en headers', async () => {
            localStorage.setItem(
                'uride-session-storage-v2',
                JSON.stringify({
                    state: {
                        session: {
                            access_token: 'token-storage',
                        },
                    },
                }),
            )

            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('/profile', {
                headers: {
                    Authorization: 'Bearer token-manual',
                },
            })

            const [, options] = vi.mocked(fetch).mock.calls[0]
            const headers = options?.headers as Headers

            expect(headers.get('Authorization')).toBe('Bearer token-manual')
        })

        it('debe eliminar sesión corrupta del localStorage', async () => {
            localStorage.setItem('uride-session-storage-v2', '{json inválido')

            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('/test')

            expect(localStorage.getItem('uride-session-storage-v2')).toBeNull()
        })

        it('debe eliminar claves antiguas de sesión cuando no hay token', async () => {
            localStorage.setItem('uride-session-storage', 'old-session')
            localStorage.setItem('uride-session', 'old-session')

            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('/test')

            expect(localStorage.getItem('uride-session-storage')).toBeNull()
            expect(localStorage.getItem('uride-session')).toBeNull()
        })

        it('debe retornar undefined si la respuesta viene vacía', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: '',
                }) as unknown as Response,
            )

            const result = await requestJson('/empty')

            expect(result).toBeUndefined()
        })

        it('debe retornar texto si content-type no es JSON', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: 'respuesta plana',
                    contentType: 'text/plain',
                }) as unknown as Response,
            )

            const result = await requestJson<string>('/text')

            expect(result).toBe('respuesta plana')
        })

        it('debe lanzar error con message string cuando la respuesta no es ok', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    ok: false,
                    status: 400,
                    text: JSON.stringify({ message: 'Datos inválidos' }),
                }) as unknown as Response,
            )

            await expect(requestJson('/error')).rejects.toThrow('Datos inválidos')
        })

        it('debe lanzar error con message array cuando la respuesta no es ok', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    ok: false,
                    status: 400,
                    text: JSON.stringify({
                        message: ['Campo requerido', 'Correo inválido'],
                    }),
                }) as unknown as Response,
            )

            await expect(requestJson('/error')).rejects.toThrow(
                'Campo requerido, Correo inválido',
            )
        })

        it('debe lanzar error con campo error cuando no existe message', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    ok: false,
                    status: 500,
                    text: JSON.stringify({ error: 'Error del servidor' }),
                }) as unknown as Response,
            )

            await expect(requestJson('/error')).rejects.toThrow('Error del servidor')
        })

        it('debe lanzar HTTP status cuando no hay body de error', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    ok: false,
                    status: 404,
                    text: '',
                }) as unknown as Response,
            )

            await expect(requestJson('/error')).rejects.toThrow('HTTP 404')
        })

        it('debe lanzar texto plano cuando el error no es JSON', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    ok: false,
                    status: 500,
                    text: 'Fallo inesperado',
                    contentType: 'text/plain',
                }) as unknown as Response,
            )

            await expect(requestJson('/error')).rejects.toThrow('Fallo inesperado')
        })

        it('debe respetar una URL absoluta', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('https://api.test.com/users')

            expect(fetch).toHaveBeenCalledWith(
                'https://api.test.com/users',
                expect.any(Object),
            )
        })

        it('debe mantener URL relativa si no inicia con slash', async () => {
            vi.mocked(fetch).mockResolvedValueOnce(
                createResponse({
                    text: JSON.stringify({ ok: true }),
                }) as unknown as Response,
            )

            await requestJson('users')

            expect(fetch).toHaveBeenCalledWith('users', expect.any(Object))
        })
    })

    describe('normalizeBackendRow', () => {
        it('debe normalizar campos camelCase a snake_case', () => {
            const row = {
                id: 1,
                conductorId: 10,
                viajeId: 20,
                pasajeroId: 30,
                calificadorId: 40,
                calificadoId: 50,
                reportanteId: 60,
                reportadoId: 70,
                usuarioId: 80,
                fechaSolicitud: '2026-01-01',
                fechaHora: '2026-01-02',
                motivoCancelacion: 'No disponible',
            }

            const result = normalizeBackendRow(row)

            expect(result.conductor_id).toBe(10)
            expect(result.viaje_id).toBe(20)
            expect(result.pasajero_id).toBe(30)
            expect(result.calificador_id).toBe(40)
            expect(result.calificado_id).toBe(50)
            expect(result.reportante_id).toBe(60)
            expect(result.reportado_id).toBe(70)
            expect(result.usuario_id).toBe(80)
            expect(result.fecha_solicitud).toBe('2026-01-01')
            expect(result.fecha_hora).toBe('2026-01-02')
            expect(result.motivo_cancelacion).toBe('No disponible')
        })

        it('debe conservar campos snake_case si ya existen', () => {
            const row = {
                id: 1,
                conductor_id: 99,
                conductorId: 10,
                viaje_id: 88,
                viajeId: 20,
            }

            const result = normalizeBackendRow(row)

            expect(result.conductor_id).toBe(99)
            expect(result.viaje_id).toBe(88)
        })
    })

    describe('normalizeRows', () => {
        it('debe normalizar un arreglo de filas', () => {
            const payload = [
                {
                    id: 1,
                    conductorId: 10,
                },
                {
                    id: 2,
                    viajeId: 20,
                },
            ]

            const result = normalizeRows(payload)

            expect(result).toHaveLength(2)
            expect(result[0].conductor_id).toBe(10)
            expect(result[1].viaje_id).toBe(20)
        })

        it('debe normalizar payload con propiedad data', () => {
            const payload = {
                data: [
                    {
                        id: 1,
                        pasajeroId: 30,
                    },
                ],
            }

            const result = normalizeRows(payload)

            expect(result).toHaveLength(1)
            expect(result[0].pasajero_id).toBe(30)
        })

        it('debe retornar arreglo vacío si payload no es válido', () => {
            expect(normalizeRows(null)).toEqual([])
            expect(normalizeRows(undefined)).toEqual([])
            expect(normalizeRows({})).toEqual([])
            expect(normalizeRows({ data: null })).toEqual([])
            expect(normalizeRows('texto')).toEqual([])
        })
    })
})