import type { PageUi } from '../../types'

export const usersUi: PageUi = {
  title: 'Usuarios',
  subtitle: 'Registro institucional, seguridad y estado de los usuarios.',
  fieldLabels: {
    correo_institucional: 'Correo institucional',
    nombre: 'Nombre',
    carrera: 'Carrera',
    telefono: 'Telefono',
    zona_barrio: 'Zona o barrio',
    estado: 'Estado',
  },
  fieldPlaceholders: {
    correo_institucional: 'usuario@universidad.edu',
    nombre: 'Nombre completo',
  }
}

export default usersUi
