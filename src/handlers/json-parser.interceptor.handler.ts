import {HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {fromJson} from '../util/FixedJson';

export function jsonHttpInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (req.responseType === "json") {
    return next(req.clone({
      responseType: "text",
    })).pipe(map(event => {
      if (event instanceof HttpResponse) {
        return event.clone({
          body: fromJson(event.body as string),
        });
      }
      return event;
    }));
  }
  return next(req);
}
