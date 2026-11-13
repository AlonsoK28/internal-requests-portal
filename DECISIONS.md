

- uso de angular material
- uso de angular 22 workspace
- uso de session storage para mantener la sesion hasta cerrar la pestaña o cerrar session manual:

    - Se implementó un servicio propio SessionStore utilizando Angular Signals, en lugar de NgRx SignalStore, debido al alcance reducido del estado global. Esta solución evita dependencias adicionales y permite compartir la sesión entre el shell y los remotes mediante Native Federation. La librería shared se configura como singleton y el servicio utiliza providedIn: 'root' para conservar una instancia por aplicación federada. 


- implementar <data-table> como shared
- se inicializa `playwright` en el proyecto
