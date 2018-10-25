import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import 'hammerjs';

// Patch touch events
(function() {
  function touchHandler(event) {
    const touches = event.changedTouches,
      first = touches[0];
    let type = '';
    switch (event.type) {
      case 'touchstart':
        type = 'mousedown';
        break;
      case 'touchmove':
        type = 'mousemove';
        break;
      case 'touchend':
        type = 'mouseup';
        break;
      default:
        return;
    }
    const simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
      first.screenX, first.screenY,
      first.clientX, first.clientY, false,
      false, false, false, 0/*left*/, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }

  function init() {
    document.addEventListener('touchstart', touchHandler, {passive: true});
    document.addEventListener('touchmove', touchHandler, {passive: true});
    document.addEventListener('touchend', touchHandler, {passive: true});
    document.addEventListener('touchcancel', touchHandler, {passive: true});
  }

  init();
})();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
