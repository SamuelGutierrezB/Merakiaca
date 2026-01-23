export interface Branch {
  id: string;
  name: string;
  address: string;
  schedule: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  mapUrl: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const branches: Branch[] = [
  {
    id: "matriz-juarez",
    name: "Matriz Juárez",
    address: "Pedro Moreno 776 int B, Colonia Centro. Frente al Parque Rojo",
    schedule: {
      weekdays: "11:00 - 20:00",
      saturday: "10:00 - 17:00",
      sunday: "11:00 - 15:00",
    },
    mapUrl: "https://maps.google.com/?q=20.6754,-103.3476",
    coordinates: { lat: 20.6754, lng: -103.3476 },
  },
  {
    id: "periferico-norte",
    name: "Periférico Norte",
    address:
      "Lateral Prol. Federalismo # 651 B, Casi esquina Periférico Norte. A espaldas de la estación Periférico Norte",
    schedule: {
      weekdays: "11:00 - 20:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.7104,-103.3592",
    coordinates: { lat: 20.7104, lng: -103.3592 },
  },
  {
    id: "sur",
    name: "SUR",
    address:
      "Av. Cristobal Colón 6030, Local 6, Santa María Tequepexpan. A un lado del INE Y Pastelerías Marisa",
    schedule: {
      weekdays: "11:00 - 19:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.6156,-103.3738",
    coordinates: { lat: 20.6156, lng: -103.3738 },
  },
  {
    id: "oblatos",
    name: "OBLATOS",
    address:
      "Avenida Artesanos 1135 L1, Circunvalación Oblatos (entre Hacienda Zenzontla y Hacienda Totolimixpa)",
    schedule: {
      weekdays: "11:00 - 19:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.6889,-103.3089",
    coordinates: { lat: 20.6889, lng: -103.3089 },
  },
  {
    id: "tetlan",
    name: "TETLÁN",
    address:
      "Gigantes #4373 (Frente a escaleras de la estación Tetlan del Tren Ligero)",
    schedule: {
      weekdays: "11:00 - 18:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.6465,-103.3234",
    coordinates: { lat: 20.6465, lng: -103.3234 },
  },
  {
    id: "tonala",
    name: "TONALÁ",
    address:
      "Calle Nicolas Bravo #40 D, Tonalá Centro (Entre Emiliano Zapata y Benito Juarez)",
    schedule: {
      weekdays: "11:00 - 18:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.6235,-103.2333",
    coordinates: { lat: 20.6235, lng: -103.2333 },
  },
  {
    id: "aviacion",
    name: "AVIACIÓN",
    address:
      "Av. Base Aérea #980, Col. Nuevo México, Zapopán, Jalisco. Entre Priv. Juan Martín y Priv. Atotonilco",
    schedule: {
      weekdays: "11:00 - 19:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.7234,-103.3956",
    coordinates: { lat: 20.7234, lng: -103.3956 },
  },
  {
    id: "tlaquepaque",
    name: "TLAQUEPAQUE CENTRO",
    address:
      "Carrillo Puerto #60, entre calle Constitución y calle Morelos. Tlaquepaque Centro",
    schedule: {
      weekdays: "11:00 - 18:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.6404,-103.3125",
    coordinates: { lat: 20.6404, lng: -103.3125 },
  },
  {
    id: "tlajomulco",
    name: "TLAJOMULCO",
    address:
      "Centro Comercial San Sebastián #1915-1 Local F2, Arriba de tienda Coppel, Frente a la Clínica 180 del IMSS",
    schedule: {
      weekdays: "11:00 - 18:00",
      saturday: "11:00 - 17:00",
      sunday: "CERRADO",
    },
    mapUrl: "https://maps.google.com/?q=20.4734,-103.4412",
    coordinates: { lat: 20.4734, lng: -103.4412 },
  },
];
