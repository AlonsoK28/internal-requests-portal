## Decisiones

- uso de angular workspace vacio en lugar de nx
    - opinion: `angular` ofrece la posibilidad de crear un workspace vacío y posteriormente generar los proyectos necesarios para inicializar la arquitectura `native-federation`, sin necesidad de dependencias de terceros como `nx`, aprovechando esta característica para ganar tiempo, sin configuración adicional.

- uso de angular material como framework del proyecto
    - opinion: se implementa angioma como framework implementación rápida y visual de los componentes de esta librería en el proyecto usando los ejemplos de la documentación

- uso de session storage para mantener la sesion hasta cerrar la pestaña o cerrar session manual:

    - opinion: Se implementó un servicio propio SessionStore utilizando Angular Signals, en lugar de NgRx SignalStore, debido al alcance reducido del estado global. 
    
    - Esta solución evita dependencias adicionales y permite compartir la sesión entre el shell y los remotes mediante Native Federation. 
    
    - La librería shared se configura como singleton y el servicio utiliza providedIn: 'root' para conservar una instancia por aplicación federada. 

    - asimismo, se guarda la sesión usando sesiones Storage de navegador para evitar login innecesarios recargar la pagina de la aplicación.


- arquitectura de shared

    - se implementa <data-table> en shared para ambos `remotes` para recuperar la lista de datos, separando lógica del negocio, en cada caso del `mfe`

    - se implemementa `auth-api.service.ts` y `session.store.ts` en shared para el consumo en los remotes
    
    - los mfe se protegen con guards que validan el rol dado de acuerdo al login

- se inicializa `playwright` en el proyecto
    - opinion: se inicializa la configuración de `playwright` en el proyecto para posteriormente continuar con las pruebas `e2e`

- manejo de `http 409` en `/approvals`
    > notas: inicialmente podía reproducir el error 409, cuando no tenía filtros para las acciones de la <data-table>, ya que en la implementación quedó que la columna de acciones sólo se muestra cuando el estatus es igual a pendiente, sin embargo también implemente el manejo de la notificación de este caso (http 409), cuando una petición ya fue aprobada y este comportamiento está en `projects/shared/src/lib/conflict-dialog`

## TODOS:
- implementación de i18n con https://ngx-translate.org/getting-started/angular-compatibility/#supported-versions