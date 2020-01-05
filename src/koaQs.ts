import Koa from 'koa';
import merge from 'merge-descriptors';
import qs, {IParseOptions, IStringifyOptions} from 'qs';

export default function koaQs(app: Koa,
                              parseOptions?: IParseOptions,
                              stringifyOptions?: IStringifyOptions): void {
  merge(app.request, {
    get query() {
      const str = this.querystring;
      if (!str)
        return {};
      const c = this._querycache = this._querycache || {};
      let query = c[str];
      if (!query) {
        c[str] = query = qs.parse(str, parseOptions);
      }
      return query;
    },
    set query(obj) {
      this.querystring = qs.stringify(obj, stringifyOptions);
    },
  });
}
