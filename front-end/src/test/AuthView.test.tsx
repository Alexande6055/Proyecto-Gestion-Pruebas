import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AuthView } from "../pages/Auth/AuthView";
import { authService } from "../services";

vi.mock("../services", () => ({
    authService: {
        login: vi.fn(),
        register: vi.fn(),
        forgotPassword: vi.fn(),
        resetPassword: vi.fn(),
        saveSession: vi.fn(),
        getSession: vi.fn(),
        clearSession: vi.fn(),
    },
}));

describe("AuthView", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });

    test("debe renderizar la vista de login por defecto", () => {
        render(<AuthView onAuthenticated={vi.fn()} />);

        expect(
            screen.getByRole("heading", { name: /iniciar sesion/i })
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(/tu\.correo@universidad\.edu/i)
        ).toBeInTheDocument();

        expect(
            screen.getByPlaceholderText(/minimo 6 caracteres/i)
        ).toBeInTheDocument();

        expect(
            screen.getByRole("button", { name: /entrar/i })
        ).toBeInTheDocument();
    });

    test("debe permitir escribir correo y contraseña en login", async () => {
        const user = userEvent.setup();

        render(<AuthView onAuthenticated={vi.fn()} />);

        const correoInput = screen.getByPlaceholderText(
            /tu\.correo@universidad\.edu/i
        );

        const passwordInput = screen.getByPlaceholderText(
            /minimo 6 caracteres/i
        );

        await user.type(correoInput, "ana@uta.edu.ec");
        await user.type(passwordInput, "123456");

        expect(correoInput).toHaveValue("ana@uta.edu.ec");
        expect(passwordInput).toHaveValue("123456");
    });

    test("debe iniciar sesión correctamente y guardar la sesión", async () => {
        const user = userEvent.setup();
        const onAuthenticated = vi.fn();

        const sessionMock = {
            token: "token-prueba",
            user: {
                id: 1,
                nombre: "Ana Torres",
                correo_institucional: "ana@uta.edu.ec",
                rol: "estudiante",
            },
        };

        vi.mocked(authService.login).mockResolvedValueOnce(sessionMock as any);

        render(<AuthView onAuthenticated={onAuthenticated} />);

        await user.type(
            screen.getByPlaceholderText(/tu\.correo@universidad\.edu/i),
            "ana@uta.edu.ec"
        );

        await user.type(
            screen.getByPlaceholderText(/minimo 6 caracteres/i),
            "123456"
        );

        await user.click(screen.getByRole("button", { name: /entrar/i }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalledWith({
                correo_institucional: "ana@uta.edu.ec",
                password: "123456",
            });
        });

        expect(authService.saveSession).toHaveBeenCalledWith(sessionMock);
        expect(onAuthenticated).toHaveBeenCalledWith(sessionMock);
    });

    test("debe cambiar a modo registro al presionar el botón Registro", async () => {
        const user = userEvent.setup();

        render(<AuthView onAuthenticated={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: /registro/i }));

        expect(
            screen.getByRole("heading", { name: /crear cuenta/i })
        ).toBeInTheDocument();

        expect(screen.getByPlaceholderText(/tu nombre completo/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ingenieria de software/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/ciudad jardin/i)).toBeInTheDocument();
    });

    test("debe registrar una cuenta correctamente y volver al login", async () => {
        const user = userEvent.setup();

        vi.mocked(authService.register).mockResolvedValueOnce({
            message: "Usuario registrado correctamente",
        } as any);

        render(<AuthView onAuthenticated={vi.fn()} />);

        await user.click(screen.getByRole("button", { name: /registro/i }));

        await user.type(
            screen.getByPlaceholderText(/tu\.correo@universidad\.edu/i),
            "nuevo@uta.edu.ec"
        );

        await user.type(
            screen.getByPlaceholderText(/minimo 6 caracteres/i),
            "123456"
        );

        await user.type(
            screen.getByPlaceholderText(/tu nombre completo/i),
            "Nuevo Usuario"
        );

        await user.type(
            screen.getByPlaceholderText(/ingenieria de software/i),
            "Software"
        );

        await user.type(
            screen.getByPlaceholderText(/ciudad jardin/i),
            "Huachi"
        );

        await user.type(
            screen.getByPlaceholderText(/\+57 300 000 0000/i),
            "0999999999"
        );

        await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalledWith({
                correo_institucional: "nuevo@uta.edu.ec",
                password: "123456",
                nombre: "Nuevo Usuario",
                carrera: "Software",
                zona_barrio: "Huachi",
                telefono: "0999999999",
            });
        });

        await waitFor(() => {
            expect(
                screen.getByRole("heading", { name: /iniciar sesion/i })
            ).toBeInTheDocument();
        });
    });

    test("debe mostrar mensaje de error cuando falla el login", async () => {
        const user = userEvent.setup();

        vi.mocked(authService.login).mockRejectedValueOnce(
            new Error("Credenciales incorrectas")
        );

        render(<AuthView onAuthenticated={vi.fn()} />);

        await user.type(
            screen.getByPlaceholderText(/tu\.correo@universidad\.edu/i),
            "error@uta.edu.ec"
        );

        await user.type(
            screen.getByPlaceholderText(/minimo 6 caracteres/i),
            "123456"
        );

        await user.click(screen.getByRole("button", { name: /entrar/i }));

        expect(
            await screen.findByText(/credenciales incorrectas/i)
        ).toBeInTheDocument();
    });
});