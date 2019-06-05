'use strict';



;define("screwdriver-ui/404/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/404/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "xXTw6MTo",
    "block": "{\"symbols\":[],\"statements\":[[1,[23,\"404-display\"],false],[0,\"\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/404/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/app", ["exports", "ember-load-initializers", "screwdriver-ui/resolver", "screwdriver-ui/config/environment"], function (_exports, _emberLoadInitializers, _resolver, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const App = Ember.Application.extend({
    modulePrefix: _environment.default.modulePrefix,
    podModulePrefix: _environment.default.podModulePrefix,
    Resolver: _resolver.default
  });
  (0, _emberLoadInitializers.default)(App, _environment.default.modulePrefix);

  if (_environment.default.environment === 'development') {
    Ember.run.backburner.DEBUG = true;
  }

  var _default = App;
  _exports.default = _default;
});
;define("screwdriver-ui/application/adapter", ["exports", "ember-inflector", "ember-data", "screwdriver-ui/config/environment", "ember-simple-auth/mixins/data-adapter-mixin"], function (_exports, _emberInflector, _emberData, _environment, _dataAdapterMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  // urls are of the form: https://server.com/namespace/key1s/:id/key2s, but :id and key2s are optional
  const urlPathParser = new RegExp("/".concat(_environment.default.APP.SDAPI_NAMESPACE, "/([^/]+)(/([^/]+))?(/([^/]+))?"));

  var _default = _emberData.default.RESTAdapter.extend(_dataAdapterMixin.default, {
    session: Ember.inject.service('session'),
    namespace: _environment.default.APP.SDAPI_NAMESPACE,
    host: _environment.default.APP.SDAPI_HOSTNAME,

    /** Just to override the assertion from `DataAdapterMixin` */
    authorize() {},

    /**
     * Add cors support to all ajax calls
     * @method ajax
     * @param  {String} url    the url for the calls
     * @param  {String} method the type of call eg. GET POST
     * @param  {Object} hash   configuration object for the call
     * @return {Promise}
     */
    ajax(url, method, hash) {
      const finalHash = hash || {};
      finalHash.crossDomain = true;
      finalHash.xhrFields = {
        withCredentials: true
      };
      return this._super(url, method, finalHash);
    },

    get headers() {
      return {
        Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
      };
    },

    /**
     * Interface for adding content to a payload before handleResponse is complete
     * Ideally, this could be handled by a model specific adapter or serializer, but Ember doesn't use
     * the correct [foo] adapter when making calls to /pipeline/:id/foo
     * @method decoratePayload
     * @param  {String}   key       Descriptor of model name
     * @param  {Object}   payload   Raw response object
     * @private
     */
    decoratePayload(key, payload) {
      if (Array.isArray(payload[key])) {
        payload[key].map(o => this.insertLink(key, o));
      } else {
        this.insertLink(key, payload[key]);
      }
    },

    /**
     * Insert links configuration into responses for child data. Modifies object in place.
     * @method insertLink
     * @param  {String}   key   Descriptor of model name
     * @param  {Object}   [o]   Response object for model
     * @private
     */
    insertLink(key, o) {
      if (!o) {
        return;
      }

      if (key === 'pipeline' || key === 'pipelines') {
        o.links = {
          events: 'events',
          jobs: 'jobs',
          secrets: 'secrets',
          tokens: 'tokens',
          metrics: 'metrics'
        };
      } else if (key === 'event' || key === 'events') {
        o.links = {
          builds: 'builds'
        };
      } else if (key === 'job' || key === 'jobs') {
        o.links = {
          builds: 'builds?count=10&page=1',
          metrics: 'metrics'
        };
      }
    },

    /**
     * Overriding default adapter because our API doesn't provide model names around request data
     * https://github.com/emberjs/data/blob/v2.7.0/addon/adapters/rest.js#L883
     * @method handleResponse
     * @param  {Number}       status      response status
     * @param  {Object}       headers     response headers
     * @param  {Object}       payload     response payload
     * @param  {Object}       requestData original request info
     * @return {Object | DS.AdapterError} response
     */
    handleResponse(status, headers, payload, requestData) {
      // handle generically when there is an error key in the payload
      // Convert our errors to JSONAPI format [required in ember-data 2.13]
      if (payload && payload.error) {
        let errors = payload.error;

        if (typeof errors === 'string') {
          errors = [{
            status: payload.statusCode,
            title: payload.error,
            detail: payload.message,
            data: payload.data
          }];
        }

        if (typeof errors === 'object' && !Array.isArray(errors)) {
          errors = [{
            status: errors.statusCode,
            title: errors.error,
            detail: errors.message
          }];
        } // Rewrite the error message for guest users


        errors = errors.map(err => {
          if (err.detail === 'Insufficient scope') {
            err.detail = 'You do not have adequate permissions to perform this action.';
          }

          return err;
        });
        return this._super(status, headers, {
          errors
        }, requestData);
      }

      let data = {};
      let key;
      const requestUrl = new URL(requestData.url);
      const matches = requestUrl.pathname.match(urlPathParser); // catch if we got a really weird url

      if (!matches) {
        // bail
        return this._super(...arguments);
      } // the last key on the path and remove the s at the end


      key = matches[5] || matches[1];
      key = key.substr(0, key.length - 1); // Fix our API not returning the model name in payload

      if (payload && Array.isArray(payload)) {
        key = "".concat(key, "s");
        data[key] = payload;
      } else if (payload) {
        data[key] = payload;
      }

      this.decoratePayload(key, data); // Pass-through to super-class

      return this._super(status, headers, data, requestData);
    },

    /**
     * Overriding default adapter because pipeline token's endpoint is differnt
     * from user api token.
     * @method urlForFindAll
     * @param  {String}      modelName
     * @param  {Object}      snapshot
     * @return {String}      url
     */
    urlForFindAll(modelName, snapshot) {
      if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
        return this._super(modelName, snapshot);
      }

      return "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(snapshot.adapterOptions.pipelineId, "/tokens");
    },

    /**
     * Overriding default adapter because pipeline token's endpoint is differnt
     * from user api token.
     * @method urlForCreateRecord
     * @param  {String}      modelName
     * @param  {Object}      snapshot
     * @return {String}      url
     */
    urlForCreateRecord(modelName, snapshot) {
      if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
        return this._super(modelName, snapshot);
      }

      return "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(snapshot.adapterOptions.pipelineId, "/tokens");
    },

    /**
     * Overriding default adapter because pipeline token's endpoint is differnt
     * from user api token.
     * @method urlForUpdateRecord
     * @param  {String}      id
     * @param  {String}      modelName
     * @param  {Object}      snapshot
     * @return {String}      url
     */
    urlForUpdateRecord(id, modelName, snapshot) {
      if (modelName !== 'token' || snapshot.adapterOptions === undefined) {
        return this._super(id, modelName, snapshot);
      }

      return "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(snapshot.adapterOptions.pipelineId, "/tokens/").concat(id);
    },

    /**
     * Overriding default adapter because pipeline token's endpoint is differnt
     * from user api token.
     * @method urlForDeleteRecord
     * @param  {String}      id
     * @param  {String}      modelName
     * @param  {Object}      snapshot
     * @return {String}      url
     */
    urlForDeleteRecord(id, modelName, snapshot) {
      if (modelName !== 'token' || snapshot.adapterOptions.pipelineId === undefined) {
        return this._super(id, modelName, snapshot);
      }

      return "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(snapshot.adapterOptions.pipelineId, "/tokens/").concat(id);
    },

    /**
     * Overriding default adapter in order to pass pagination query params to
     * the pipeline events api.
     * @param  {Object} query
     * @param  {String} modelName
     * @return {String} url
     */
    urlForQuery(query, modelName) {
      if (modelName === 'event' || modelName === 'metric') {
        const {
          pipelineId,
          jobId
        } = query;
        delete query.pipelineId;
        delete query.jobId; // eslint-disable-next-line prefer-template

        return "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE).concat(pipelineId ? "/pipelines/".concat(pipelineId) : "/jobs/".concat(jobId), "/").concat((0, _emberInflector.pluralize)(modelName));
      }

      return this._super(...arguments);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/application/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    alias
  } = Ember.computed;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service('session'),
    scmContexts: alias('model'),
    actions: {
      invalidateSession() {
        this.session.set('data.sessionChanged', false);
        return this.session.invalidate();
      },

      search(params) {
        this.transitionToRoute('search', {
          queryParams: {
            query: params
          }
        });
      },

      authenticate(scmContext) {
        const {
          session
        } = this;
        const currentContext = session.get('data.authenticated.scmContext');
        session.authenticate('authenticator:screwdriver-api', scmContext).then(() => {
          if (currentContext && currentContext !== scmContext) {
            session.set('data.sessionChanged', true);
          }
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/application/route", ["exports", "ember-simple-auth/mixins/application-route-mixin"], function (_exports, _applicationRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_applicationRouteMixin.default, {
    scmService: Ember.inject.service('scm'),
    session: Ember.inject.service('session'),
    store: Ember.inject.service('store'),
    reloadPage: window.location.reload.bind(window.location),

    beforeModel(transition) {
      if (!this.get('session.isAuthenticated')) {
        this.set('session.attemptedTransition', transition);
      }
    },

    model() {
      return this.scmService.createScms();
    },

    sessionInvalidated() {
      this.reloadPage();
    },

    // eslint-disable-next-line ember/no-observers
    sessionChanged: Ember.observer('session.data.sessionChanged', function sessionChanged() {
      if (this.session.get('data.sessionChanged')) {
        this.session.set('data.sessionChanged', false);
        this.store.unloadAll();
        this.reloadPage();
      }
    }),

    title(tokens) {
      let arr = Array.isArray(tokens) ? tokens : [];
      arr.push('screwdriver.cd');
      return arr.join(' > ');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/application/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "eyMgJHAw",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"currentUrl\",\"scmContexts\",\"session\",\"authenticate\",\"onInvalidate\",\"searchPipelines\"],[[25,[\"currentUrl\"]],[25,[\"scmContexts\"]],[25,[\"session\"]],[29,\"action\",[[24,0,[]],\"authenticate\"],null],[29,\"action\",[[24,0,[]],\"invalidateSession\"],null],[29,\"action\",[[24,0,[]],\"search\"],null]]]],false],[0,\"\\n\"],[1,[23,\"nav-banner\"],false],[0,\"\\n\"],[7,\"div\"],[11,\"id\",\"appContainer\"],[11,\"class\",\"container-fluid\"],[9],[0,\"\\n  \"],[1,[23,\"outlet\"],false],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/application/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/authenticators/screwdriver-api", ["exports", "jquery", "ember-simple-auth/authenticators/base", "ember-cli-jwt-decode", "screwdriver-ui/config/environment"], function (_exports, _jquery, _base, _emberCliJwtDecode, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const loginUrlBase = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/auth/login");
  const tokenUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/auth/token");
  const logoutUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/auth/logout");
  /**
   * Constructs session.data.authenticated object
   * @method getData
   * @param  {String} token        JWT Token
   * @param  {Object} decodedToken Decoded JWT Token
   * @return {Object}
   */

  function getData(token, decodedToken) {
    let {
      username,
      scope,
      scmContext
    } = decodedToken;
    const isGuest = scope.includes('guest');

    if (isGuest) {
      scmContext = scmContext || 'guest';
    }

    return Object.assign({}, {
      username,
      scope,
      scmContext,
      isGuest,
      token
    });
  }
  /**
   * Fetches a jwt from api and returns result in RSVP Promise
   * @method fetchToken
   * @return {Promise}
   */


  function fetchToken() {
    return new Ember.RSVP.Promise((resolve, reject) => {
      // Call the token api to get the session info
      _jquery.default.ajax({
        url: tokenUrl,
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        }
      }).done(jwt => // Add some data from the JWT to the session data
      resolve(getData(jwt.token, (0, _emberCliJwtDecode.jwt_decode)(jwt.token)))).fail(() => reject('Could not get a token'));
    });
  }

  var _default = _base.default.extend({
    scmService: Ember.inject.service('scm'),

    /**
     * Restore the state of a session with data already in the session store
     * @method restore
     * @param  {Object}  data    Data in the session store
     * @return {Promise}
     */
    restore(data) {
      return new Ember.RSVP.Promise((resolve, reject) => {
        const jwt = Ember.get(data, 'token');

        if (!Ember.isEmpty(jwt)) {
          const decodedJWT = (0, _emberCliJwtDecode.jwt_decode)(jwt); // Token expired, reject

          if (decodedJWT.exp * 1000 < Date.now()) {
            return reject();
          }

          const authData = getData(jwt, decodedJWT);
          return resolve(authData);
        }

        return reject();
      });
    },

    /**
     * Authenticates with resource
     * @method authenticate
     * @param  {String}  [scmContext]    scmContext of the user
     * @return {Promise}
     */
    authenticate(scmContext) {
      const scm = this.scmService;
      return new Ember.RSVP.Promise((resolve, reject) => {
        let url = [loginUrlBase];

        if (scmContext) {
          url.push(scmContext);
        }

        url.push('web'); // Open a window for github auth flow

        const win = window.open(url.join('/'), 'SDAuth', 'width=1024,height=768,resizable,alwaysRaised'); // check to see if the window has closed

        const interval = setInterval(() => {
          if (win === null || win.closed) {
            clearInterval(interval);
            fetchToken().then(resolve, reject); // change status as logged in.

            scm.setSignedIn(scmContext);
          } else {
            win.focus();
          }
        }, 100);
      });
    },

    /**
     * Log the user out from the resource
     * @method invalidate
     * @return {Promise}
     */
    invalidate() {
      return new Ember.RSVP.Promise(resolve => {
        _jquery.default.ajax({
          url: logoutUrl,
          method: 'POST',
          crossDomain: true,
          xhrFields: {
            withCredentials: true
          }
        }).always(() => resolve());
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/banner/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const bannersUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/banners");

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    /**
     * Calls the banner api service to fetch active banners
     * @method fetchBanners
     * @return {Promise}        Resolves to a list of banner structures
     */
    fetchBanners() {
      return new Ember.RSVP.Promise(resolve => {
        // Fetch the banners directly from the API
        _jquery.default.ajax({
          url: bannersUrl,
          headers: {
            Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
          }
        }).done(banners => {
          if (Array.isArray(banners)) {
            const activeBanners = banners.filter(banner => banner.isActive === true);
            resolve(activeBanners);
          } else {
            resolve([]);
          }
        }).fail(() => resolve([]));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/breakpoints", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    mobile: '(max-width: 767px)',
    tablet: '(min-width: 768px) and (max-width: 991px)',
    desktop: '(min-width: 992px) and (max-width: 1200px)'
  };
  _exports.default = _default;
});
;define("screwdriver-ui/build-artifact/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /**
   * Recursively remove children and change part type of files (as opposed to directories)
   * @method  changeFiles
   * @param  {Object|Array}    tree      Current level of the output tree
   */
  function changeFiles(tree) {
    let parts;

    if (!tree.children) {
      parts = tree;
    } else {
      parts = tree.children;
    }

    parts.forEach(part => {
      if (part.children.length === 0) {
        part.type = 'file';
        delete part.children;
      } else {
        delete part.a_attr;
        changeFiles(part);
      }
    });
  }
  /**
   * Recursively remove children and change part type of files (as opposed to directories)
   * @method arrangeIntoTree
   * @param  {String[]}      paths     An array of filepaths
   * @param  {String}        baseUrl   Base URL to link to for artifacts directory in Store
   * @return {Object[]}                A tree representaion of dir/file structure
   */


  function arrangeIntoTree(paths, baseUrl) {
    const tree = [];
    let currentLevel;
    paths.forEach(path => {
      const pathParts = path.split('/');
      pathParts.shift(); // Remove first blank element from the parts array.

      currentLevel = tree; // initialize currentLevel to root

      pathParts.forEach(part => {
        // check to see if the path already exists.
        const existingPath = currentLevel.filter(obj => obj.text === part)[0];

        if (existingPath) {
          // The path to this item was already in the tree, so don't add it again.
          // Set the current level to this path's children
          currentLevel = existingPath.children;
        } else {
          const newPart = {
            text: part,
            type: 'directory',
            a_attr: {
              href: baseUrl + pathParts.join('/')
            },
            children: []
          };
          currentLevel.push(newPart);
          currentLevel = newPart.children;
        }
      });
    });
    changeFiles(tree);
    return tree;
  }

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    /**
     * Calls the store api service to fetch build artifact manifest
     * @method fetchManifest
     * @param  {Integer}  buildId     Build id
     * @return {Promise}              Resolves to a tree representaion of the dir/file structure
     */
    fetchManifest(buildId) {
      let manifest = []; // Fetch the manifest directly from the store to prevent CORS issues

      const manifestUrl = "".concat(_environment.default.APP.SDSTORE_HOSTNAME, "/").concat(_environment.default.APP.SDSTORE_NAMESPACE) + "/builds/".concat(buildId, "/ARTIFACTS/manifest.txt"); // Set artifact file links to api to get redirects to store with short-lived jwt tokens

      const baseUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/builds/").concat(buildId, "/artifacts/");
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (!this.get('session.isAuthenticated')) {
          return reject(new Error('User is not authenticated'));
        }

        return _jquery.default.ajax({
          url: manifestUrl,
          headers: {
            Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
          }
        }).done(data => {
          const paths = data.split('\n').sort(); // sort in alphabetical order

          manifest = arrangeIntoTree(paths, baseUrl);
        }).always(() => resolve(manifest));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/build-logs/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),
    cache: Object.create(null),
    blobKeys: [],

    /**
     * Calls the logs api service to fetch logs
     * @method fetchLogs
     * @param  {Object}  config                         config for fetching logs
     * @param  {String}  config.buildId                 sha representing a build id
     * @param  {String}  config.stepName                name of a step
     * @param  {Number}  [config.logNumber=0]           The line number to start from
     * @param  {Number}  [config.pageSize=10]           The number of pages to load
     * @param  {String}  [config.sortOrder='ascending'] The sort order. 'ascending' | 'descending'
     * @param  {String}  [config.started=false]         Is step started
     * @return {Promise}                                Resolves to { lines, done }
     */
    fetchLogs({
      buildId,
      stepName,
      logNumber = 0,
      pageSize = 10,
      sortOrder = 'ascending',
      started = false
    }) {
      let lines = [];
      let done = false;
      const inProgress = sortOrder === 'ascending';
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/builds/".concat(buildId, "/steps/").concat(stepName, "/logs");
      return new Ember.RSVP.Promise((resolve, reject) => {
        if (!this.get('session.isAuthenticated')) {
          return reject(new Error('User is not authenticated'));
        } // convert jquery's ajax promises to a real promise


        return _jquery.default.ajax({
          url,
          data: {
            from: logNumber,
            pages: pageSize,
            sort: sortOrder
          },
          headers: {
            Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
          }
        }).done((data, textStatus, jqXHR) => {
          if (Array.isArray(data)) {
            lines = data;
          }

          done = started && jqXHR.getResponseHeader('x-more-data') === 'false';
        }) // always resolve something
        .always(() => {
          this.setCache(buildId, stepName, {
            done
          });

          if (lines.length) {
            let existings = this.getCache(buildId, stepName, 'logs') || [];
            this.setCache(buildId, stepName, {
              nextLine: inProgress ? lines[lines.length - 1].n + 1 : lines[0].n - 1,
              logs: inProgress ? existings.concat(lines) : lines.concat(existings)
            });
          }

          resolve({
            lines,
            done
          });
        });
      });
    },

    /**
     * Set data at specified key on the cache
     * @method setCache
     *
     * @param {String} buildId
     * @param {String} stepName
     * @param {Object} data
     */
    setCache(buildId, stepName, data) {
      Ember.set(this, "cache.".concat(buildId, "/").concat(stepName), { ...Ember.get(this, "cache.".concat(buildId, "/").concat(stepName)),
        ...data
      });
    },

    /**
     * Get data by key on the cache
     * @method getCache
     *
     * @param {String} buildId
     * @param {String} stepName
     * @param {String} field
     */
    getCache(buildId, stepName, field) {
      return Ember.get(this, "cache.".concat(buildId, "/").concat(stepName, ".").concat(field));
    },

    /**
     * Empty the cache
     * @method resetCache
     */
    resetCache() {
      this.revokeLogBlobUrls();
      Ember.set(this, 'cache', Object.create(null));
    },

    /**
     * Create Object URL from the blob generated by the log data in cache
     * @method buildLogBlobUrl
     *
     * @param {String} buildId
     * @param {String} stepName
     * @returns {DOMString}
     */
    buildLogBlobUrl(buildId, stepName) {
      let blobUrl = this.getCache(buildId, stepName, 'blobUrl');

      if (!blobUrl) {
        const blob = new Blob(this.getCache(buildId, stepName, 'logs').map(l => "".concat(l.m, "\n")), {
          type: 'text/plain'
        });
        blobUrl = URL.createObjectURL(blob);
        this.setCache(buildId, stepName, {
          blobUrl
        });
        this.blobKeys.push([buildId, stepName]);
      }

      return blobUrl;
    },

    /**
     * Revoke the Object URLs
     * @method revokeLogBlobUrls
     */
    revokeLogBlobUrls() {
      this.blobKeys.forEach(k => {
        URL.revokeObjectURL(this.getCache(...k, 'blobUrl'));
        this.setCache(...k, {
          blobUrl: undefined
        });
      });
      Ember.set(this, 'blobKeys', []);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/build/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /**
   * Calulate ms difference between two times
   * @method calcDuration
   * @param  {String}         start key for start time
   * @param  {String}         end   key for end time
   * @return {Number}               ms difference
   */
  function calcDuration(start, end) {
    let endTime = new Date();
    let startTime = this.get(start);

    if (end !== 'now') {
      endTime = this.get(end);
    }

    if (typeof endTime === 'string') {
      endTime = new Date(endTime);
    }

    if (typeof startTime === 'string') {
      startTime = new Date(startTime);
    }

    if (!startTime || !endTime) {
      return 0;
    }

    return endTime.getTime() - startTime.getTime();
  }
  /**
   * Gets human readable text for a duration
   * @method durationText
   * @param  {String}         start key for start time
   * @param  {String}         end   key for end time
   * @return {String}               human readable text for duration
   */


  function durationText(start, end, largest = 1) {
    return humanizeDuration(calcDuration.call(this, start, end), {
      round: true,
      largest
    });
  }

  var _default = _emberData.default.Model.extend({
    // ember-data has some reservations with the "container" attribute name
    buildContainer: _emberData.default.attr('string'),
    cause: _emberData.default.attr('string'),
    commit: _emberData.default.attr(),
    createTime: _emberData.default.attr('date'),
    endTime: _emberData.default.attr('date'),
    eventId: _emberData.default.attr('string'),
    jobId: _emberData.default.attr('string'),
    meta: _emberData.default.attr(),
    number: _emberData.default.attr('number'),
    parameters: _emberData.default.attr(),
    parentBuildId: _emberData.default.attr('string'),
    sha: _emberData.default.attr('string'),
    startTime: _emberData.default.attr('date'),
    status: _emberData.default.attr('string'),
    stats: _emberData.default.attr(),
    statusMessage: _emberData.default.attr('string', {
      defaultValue: null
    }),
    steps: _emberData.default.attr(),
    startTimeWords: Ember.computed('startTime', {
      get() {
        return "".concat(durationText.call(this, 'startTime', 'now'), " ago");
      }

    }),
    createTimeWords: Ember.computed('createTime', {
      get() {
        const dt = durationText.call(this, 'createTime', 'now');
        return "".concat(dt, " ago");
      }

    }),
    endTimeWords: Ember.computed('endTime', {
      get() {
        if (!this.endTime) {
          return null;
        }

        return "".concat(durationText.call(this, 'endTime', 'now'), " ago");
      }

    }),
    // Queue time and blocked time are merged into blockedDuration
    blockedDuration: Ember.computed('createTime', 'stats.imagePullStartTime', {
      get() {
        return durationText.call(this, 'createTime', 'stats.imagePullStartTime', 2);
      }

    }),
    // Time it takes to pull the image
    imagePullDuration: Ember.computed('stats.imagePullStartTime', 'startTime', {
      get() {
        return durationText.call(this, 'stats.imagePullStartTime', 'startTime', 2);
      }

    }),
    buildDuration: Ember.computed('startTime', 'endTime', {
      get() {
        return durationText.call(this, 'startTime', 'endTime', 2);
      }

    }),
    totalDuration: Ember.computed('createTime', 'endTime', {
      get() {
        return durationText.call(this, 'createTime', 'endTime', 2);
      }

    }),
    totalDurationMS: Ember.computed('createTime', 'endTime', {
      get() {
        return calcDuration.call(this, 'createTime', 'endTime');
      }

    }),
    truncatedSha: Ember.computed('sha', {
      get() {
        return this.sha.substr(0, 7);
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/build/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    attrs: {
      buildContainer: 'container'
    },

    /**
     * Overrride and fill in `statusMessage` so the model can assign properly
     */
    normalizeResponse(store, typeClass, payload, id, requestType) {
      if (payload.build) {
        payload.build.statusMessage = payload.build.statusMessage || null;
      }

      if (requestType === 'findHasMany' && Array.isArray(payload.builds)) {
        payload.builds.filter(b => store.hasRecordForId('build', b.id)).forEach(b => {
          let storeBuild = store.peekRecord('build', b.id);

          if (storeBuild) {
            b.steps = Ember.get(storeBuild, 'steps').toArray();
          }
        });
      }

      return this._super(store, typeClass, payload, id, requestType);
    },

    /**
     * Override the serializeIntoHash method to handle model names without a root key
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      if (!snapshot.id) {
        return Ember.assign(hash, {
          jobId: snapshot.attr('jobId')
        });
      }

      return Ember.assign(hash, {
        status: snapshot.attr('status')
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/builds/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return this.store.findRecord('build', params.build_id).then(build => this.store.findRecord('job', build.get('jobId')).then(job => this.store.findRecord('pipeline', job.get('pipelineId')).then(pipeline => ({
        build,
        job,
        pipeline
      }))));
    },

    redirect(model) {
      return this.transitionTo('pipeline.build', model.pipeline.id, model.build.id);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/cache/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    /**
     * Calls the store api service to clear the cache data
     * @method clearCache
     * @param   {Object}  config
     * @param   {String}  config.id       The ID of pipeline, event, or job to clear the cache from
     * @param   {String}  config.scope    The scope of the cache, e.g. pipelines, events, jobs
     * @return  {Promise}                 Resolve nothing if success otherwise reject with error message
     */
    clearCache(config) {
      const {
        scope,
        id
      } = config;
      const url = "".concat(_environment.default.APP.SDSTORE_HOSTNAME, "/").concat(_environment.default.APP.SDSTORE_NAMESPACE, "/caches/").concat(scope, "/").concat(id);
      const ajaxConfig = {
        url,
        type: 'DELETE',
        contentType: 'application/json',
        crossDomain: true,
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax(ajaxConfig).done(content => resolve(content)).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          if (response.status === 401) {
            message = 'You do not have the permissions to clear the cache.';
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/collection/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    name: _emberData.default.attr('string'),
    description: _emberData.default.attr('string'),
    pipelineIds: _emberData.default.attr(),
    pipelines: _emberData.default.attr()
  });

  _exports.default = _default;
});
;define("screwdriver-ui/collection/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    /**
     * Override the serializeIntoHash method
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      const dirty = snapshot.changedAttributes();
      Object.keys(dirty).forEach(key => {
        dirty[key] = dirty[key][1];
      });
      const h = Ember.assign(hash, dirty);
      return h;
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/command/service", ["exports", "jquery", "screwdriver-ui/config/environment", "screwdriver-ui/utils/template"], function (_exports, _jquery, _environment, _template) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    getLastUpdatedTime
  } = _template.default;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    getOneCommand(namespace, name) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/commands/") + "".concat(encodeURIComponent(namespace), "/").concat(encodeURIComponent(name));
      return this.fetchData(url);
    },

    getCommandTags(namespace, name) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/commands/") + "".concat(encodeURIComponent(namespace), "/").concat(encodeURIComponent(name), "/tags");
      return this.fetchData(url);
    },

    getAllCommands(namespace) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/commands");
      let params = {
        compact: true,
        sortBy: 'createTime'
      };

      if (namespace) {
        params.namespace = namespace;
      }

      return this.fetchData(url, params).then(commands => {
        let unique = {};
        let uniqueCommands = commands.filter(c => {
          let fullName = "".concat(c.namespace, "/").concat(c.name);

          if (fullName in unique) {
            return false;
          }

          unique[fullName] = true;
          return true;
        });
        return uniqueCommands;
      });
    },

    fetchData(url, params = {}) {
      const ajaxConfig = {
        method: 'GET',
        url,
        data: params,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax(ajaxConfig).done(commands => {
          commands.forEach(command => {
            if (command.createTime) {
              // Add last updated time
              command.lastUpdated = getLastUpdatedTime({
                createTime: command.createTime
              });
            }
          });
          return resolve(commands);
        }).fail(response => reject(response));
      });
    },

    deleteCommands(namespace, name) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/commands/") + "".concat(encodeURIComponent(namespace), "/").concat(encodeURIComponent(name));
      const ajaxConfig = {
        method: 'DELETE',
        url,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax(ajaxConfig).done(content => resolve(content)).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          if (response.status === 401) {
            message = 'You do not have the permissions to remove this command.';
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    routeParams: Ember.computed('model', {
      get() {
        let route = this.model;
        let params = Object.assign({}, route.paramsFor('commands.namespace'), route.paramsFor('commands.detail'));
        return params;
      }

    }),
    crumbs: Ember.computed('routeParams', {
      get() {
        let breadcrumbs = [];
        let params = this.routeParams;

        if (params.namespace || params.detail) {
          breadcrumbs.push({
            name: 'Commands',
            params: ['commands']
          });
        }

        if (params.namespace) {
          breadcrumbs.push({
            name: params.namespace,
            params: ['commands.namespace', params.namespace]
          });
        }

        if (params.name) {
          breadcrumbs.push({
            name: params.name,
            params: ['commands.detail', params.namespace, params.name]
          });
        }

        return breadcrumbs;
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/detail/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    alias
  } = Ember.computed;

  var _default = Ember.Controller.extend({
    selectedVersion: null,
    errorMessage: '',
    command: Ember.inject.service(),
    commands: alias('model'),

    reset() {
      this.set('errorMessage', '');
    },

    latest: Ember.computed('commands.[]', {
      get() {
        return this.commands[0];
      }

    }),
    versionCommand: Ember.computed('selectedVersion', 'commands.[]', {
      get() {
        const version = this.selectedVersion || this.get('latest.version');
        return this.commands.findBy('version', version);
      }

    }),
    // Set selected version to null whenever the list of commands changes
    // eslint-disable-next-line ember/no-observers
    modelObserver: Ember.observer('commands.[]', function modelObserver() {
      this.set('selectedVersion', null);
    }),
    actions: {
      changeVersion(version) {
        this.set('selectedVersion', version);
      },

      removeCommand(namespace, name) {
        return this.command.deleteCommands(namespace, name).then(() => this.transitionToRoute('commands'), err => this.set('errorMessage', err));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/detail/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    command: Ember.inject.service(),

    model(params) {
      return Ember.RSVP.all([this.command.getOneCommand(params.namespace, params.name), this.command.getCommandTags(params.namespace, params.name)]).then(arr => {
        const [verPayload, tagPayload] = arr;
        tagPayload.forEach(tagObj => {
          const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

          if (taggedVerObj) {
            taggedVerObj.tag = taggedVerObj.tag ? "".concat(taggedVerObj.tag, " ").concat(tagObj.tag) : tagObj.tag;
          }
        });
        return verPayload;
      });
    },

    setupController(controller, model) {
      this._super(controller, model);

      controller.reset();
    },

    actions: {
      error(error) {
        if (error.status === 404) {
          this.transitionTo('/404');
        }

        return true;
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/detail/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "svGsH8Gd",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[1,[29,\"command-header\",null,[[\"command\",\"onRemoveCommand\"],[[25,[\"versionCommand\"]],[29,\"action\",[[24,0,[]],\"removeCommand\"],null]]]],false],[0,\"\\n\\n\"],[1,[29,\"command-format\",null,[[\"command\"],[[25,[\"versionCommand\"]]]]],false],[0,\"\\n\\n\"],[1,[29,\"command-versions\",null,[[\"commands\",\"changeVersion\"],[[25,[\"commands\"]],[29,\"action\",[[24,0,[]],\"changeVersion\"],null]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/commands/detail/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/index/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    command: Ember.inject.service(),

    model() {
      return this.command.getAllCommands();
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/index/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "O/loXT9F",
    "block": "{\"symbols\":[],\"statements\":[[4,\"tc-collection-list\",null,[[\"model\",\"filteringNamespace\",\"collectionType\"],[[25,[\"model\"]],[25,[\"targetNamespace\"]],\"Commands\"]],{\"statements\":[[0,\"  Commands share binaries (or scripts) across multiple jobs.\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/commands/index/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/namespace/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    command: Ember.inject.service(),
    templateName: 'commands/index',

    setupController(controller, model) {
      this._super(controller, model);

      controller.set('targetNamespace', this.paramsFor('commands.namespace').namespace);
    },

    model(params) {
      return this.command.getAllCommands(params.namespace);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    routeAfterAuthentication: 'commands',

    model() {
      return this;
    },

    actions: {
      willTransition(transition) {
        let newParams = transition.params[transition.targetName];
        this.controller.set('routeParams', newParams);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/commands/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "ItZ8SS9J",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"bread-crumbs\",null,[[\"crumbs\"],[[25,[\"crumbs\"]]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/commands/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/404-display/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "KNuE7wD0",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"code\"],[9],[0,\"404\"],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"Page Not Found!\"],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"Make sure you've entered the correct route.\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/404-display/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/app-header/component", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    tagName: 'header',
    showSearch: false,
    docUrl: _environment.default.APP.SDDOC_URL,
    slackUrl: _environment.default.APP.SLACK_URL,
    searchTerm: '',
    actions: {
      invalidateSession() {
        this.onInvalidate();
      },

      triggerSearch() {
        this.searchPipelines(this.searchTerm);
      },

      authenticate(scmContext) {
        this.authenticate(scmContext);
      },

      cancelSearch() {
        this.set('showSearch', false);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/app-header/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "LHHDBr+3",
    "block": "{\"symbols\":[\"scmContext\",\"navbar\",\"nav\",\"dd\",\"ddm\",\"scmContext\",\"dd\",\"ddm\",\"nav\",\"dd\",\"ddm\"],\"statements\":[[4,\"bs-navbar\",null,null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"navbar-header\"],[9],[0,\"\\n    \"],[1,[24,2,[\"toggle\"]],false],[0,\"\\n    \"],[4,\"link-to\",[\"home\"],[[\"class\",\"title\"],[\"logo navbar-brand\",\"Screwdriver Home\"]],{\"statements\":[[1,[29,\"inline-svg\",[\"Screwdriver_Logo_FullWhite\"],[[\"class\"],[\"img\"]]],false]],\"parameters\":[]},null],[0,\"\\n  \"],[10],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"content\"]],\"expected `navbar.content` to be a contextual component but found a string. Did you mean `(component navbar.content)`? ('screwdriver-ui/components/app-header/template.hbs' @ L6:C5) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"nav\"]],\"expected `navbar.nav` to be a contextual component but found a string. Did you mean `(component navbar.nav)`? ('screwdriver-ui/components/app-header/template.hbs' @ L7:C7) \"],null]],[[\"classNames\"],[\"navbar-nav navbar-left\"]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,9,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L8:C9) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"home\"],[[\"class\"],[\"icon\"]],{\"statements\":[[0,\"          \"],[7,\"span\"],[11,\"class\",\"home collections\"],[9],[0,\"Collections\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,9,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L13:C9) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,9,[\"dropdown\"]],\"expected `nav.dropdown` to be a contextual component but found a string. Did you mean `(component nav.dropdown)`? ('screwdriver-ui/components/app-header/template.hbs' @ L14:C11) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,10,[\"toggle\"]],\"expected `dd.toggle` to be a contextual component but found a string. Did you mean `(component dd.toggle)`? ('screwdriver-ui/components/app-header/template.hbs' @ L15:C13) \"],null]],[[\"class\"],[\"icon docs-outline\"]],{\"statements\":[[0,\"            \"],[7,\"span\"],[11,\"class\",\"home tools\"],[9],[0,\"Tools\"],[10],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"caret\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,10,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/app-header/template.hbs' @ L19:C13) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,11,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L20:C15) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"validator\"],[[\"classNames\"],[\"icon validator\"]],{\"statements\":[[0,\"                \"],[7,\"span\"],[9],[0,\"Validator\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,11,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L25:C15) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"templates\"],[[\"classNames\"],[\"icon templates\"]],{\"statements\":[[0,\"                \"],[7,\"span\"],[9],[0,\"Templates\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,11,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L30:C15) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"commands\"],[[\"classNames\"],[\"icon commands\"]],{\"statements\":[[0,\"                \"],[7,\"span\"],[9],[0,\"Commands\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[11]},null]],\"parameters\":[10]},null]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,9,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L38:C9) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"create\"],[[\"class\"],[\"icon create\"]],{\"statements\":[[0,\"          \"],[1,[29,\"inline-svg\",[\"add-circle\"],[[\"class\"],[\"img\"]]],false],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"home create-pipeline\"],[9],[0,\"Create Pipeline\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[9]},null],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"nav\"]],\"expected `navbar.nav` to be a contextual component but found a string. Did you mean `(component navbar.nav)`? ('screwdriver-ui/components/app-header/template.hbs' @ L46:C7) \"],null]],[[\"classNames\"],[\"navbar-nav navbar-right\"]],{\"statements\":[[4,\"if\",[[25,[\"showSearch\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L48:C11) \"],null]],null,{\"statements\":[[0,\"          \"],[7,\"form\"],[11,\"class\",\"navbar-form navbar-right\"],[11,\"role\",\"search\"],[9],[0,\"\\n            \"],[1,[29,\"input\",null,[[\"class\",\"name\",\"placeholder\",\"enter\",\"escape-press\",\"value\"],[\"search-input\",\"query\",\"Search Screwdriver pipelines\",[29,\"action\",[[24,0,[]],\"triggerSearch\"],null],[29,\"action\",[[24,0,[]],\"cancelSearch\"],null],[25,[\"searchTerm\"]]]]],false],[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"search-button\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-search\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"triggerSearch\"]],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L61:C11) \"],null]],null,{\"statements\":[[0,\"          \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"icon search\"],[9],[1,[29,\"inline-svg\",[\"search\"],[[\"class\"],[\"img\"]]],false],[3,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"showSearch\"]]],null],[29,\"not\",[[25,[\"showSearch\"]]],null]],[[\"preventDefault\"],[false]]],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L66:C9) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"dropdown\"]],\"expected `nav.dropdown` to be a contextual component but found a string. Did you mean `(component nav.dropdown)`? ('screwdriver-ui/components/app-header/template.hbs' @ L67:C11) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,7,[\"toggle\"]],\"expected `dd.toggle` to be a contextual component but found a string. Did you mean `(component dd.toggle)`? ('screwdriver-ui/components/app-header/template.hbs' @ L68:C13) \"],null]],[[\"class\"],[\"icon docs-outline\"]],{\"statements\":[[0,\"            \"],[1,[29,\"inline-svg\",[\"help-circle\"],[[\"class\"],[\"img\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,7,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/app-header/template.hbs' @ L71:C13) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,8,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L72:C15) \"],null]],null,{\"statements\":[[0,\"              \"],[7,\"a\"],[12,\"href\",[23,\"docUrl\"]],[11,\"class\",\"icon docs\"],[9],[0,\"\\n                \"],[1,[29,\"inline-svg\",[\"file-text\"],[[\"class\"],[\"img\"]]],false],[7,\"span\"],[9],[0,\"Documentation\"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[1,[24,8,[\"divider\"]],false],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,8,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L78:C15) \"],null]],null,{\"statements\":[[0,\"              \"],[7,\"a\"],[11,\"href\",\"http://blog.screwdriver.cd\"],[11,\"class\",\"icon blog\"],[9],[0,\"\\n                \"],[1,[29,\"inline-svg\",[\"tumblr\"],[[\"class\"],[\"img\"]]],false],[7,\"span\"],[9],[0,\"Blog\"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,8,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L83:C15) \"],null]],null,{\"statements\":[[0,\"              \"],[7,\"a\"],[12,\"href\",[23,\"slackUrl\"]],[11,\"class\",\"icon community\"],[9],[0,\"\\n                \"],[1,[29,\"inline-svg\",[\"slack\"],[[\"class\"],[\"img\"]]],false],[7,\"span\"],[9],[0,\"Slack Channel\"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,8,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L88:C15) \"],null]],null,{\"statements\":[[0,\"              \"],[7,\"a\"],[11,\"href\",\"https://github.com/screwdriver-cd\"],[11,\"class\",\"icon github\"],[9],[0,\"\\n                \"],[1,[29,\"inline-svg\",[\"github\"],[[\"class\"],[\"img\"]]],false],[7,\"span\"],[9],[0,\"Github\"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[8]},null]],\"parameters\":[7]},null]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L96:C9) \"],null]],null,{\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"dropdown\"]],\"expected `nav.dropdown` to be a contextual component but found a string. Did you mean `(component nav.dropdown)`? ('screwdriver-ui/components/app-header/template.hbs' @ L98:C13) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,4,[\"toggle\"]],\"expected `dd.toggle` to be a contextual component but found a string. Did you mean `(component dd.toggle)`? ('screwdriver-ui/components/app-header/template.hbs' @ L99:C15) \"],null]],[[\"class\"],[\"icon profile-outline\"]],{\"statements\":[[0,\"              \"],[1,[29,\"inline-svg\",[\"profile-outline\"],[[\"class\"],[\"img\"]]],false],[0,\"\\n              \"],[7,\"span\"],[11,\"class\",\"icontitle\"],[9],[1,[25,[\"session\",\"data\",\"authenticated\",\"username\"]],false],[10],[0,\"\\n              \"],[7,\"span\"],[11,\"class\",\"caret\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,4,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/app-header/template.hbs' @ L104:C15) \"],null]],null,{\"statements\":[[0,\"              \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,5,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L105:C17) \"],null]],null,{\"statements\":[[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"ACCOUNTS\"],[10]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"each\",[[25,[\"scmContexts\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,5,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L107:C19) \"],null]],null,{\"statements\":[[4,\"if\",[[24,6,[\"isSignedIn\"]]],null,{\"statements\":[[0,\"                    \"],[7,\"a\"],[11,\"class\",\"active\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[24,6,[\"iconType\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[24,6,[\"displayName\"]],false],[0,\" \"],[7,\"span\"],[9],[0,\"active\"],[10],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                    \"],[7,\"a\"],[11,\"href\",\"#authenticate\"],[9],[0,\"\\n                      \"],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[24,6,[\"iconType\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[24,6,[\"displayName\"]],false],[0,\"\\n                    \"],[3,\"action\",[[24,0,[]],\"authenticate\",[24,6,[\"context\"]]]],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[6]},null],[0,\"              \"],[1,[24,5,[\"divider\"]],false],[0,\"\\n\"],[4,\"if\",[[29,\"not\",[[25,[\"session\",\"data\",\"authenticated\",\"isGuest\"]]],null]],null,{\"statements\":[[0,\"                \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,5,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L119:C19) \"],null]],null,{\"statements\":[[4,\"link-to\",[\"user-settings\"],[[\"title\"],[\"User Settings\"]],{\"statements\":[[0,\"User Settings\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,5,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/app-header/template.hbs' @ L121:C17) \"],null]],null,{\"statements\":[[0,\"                \"],[7,\"a\"],[11,\"href\",\"#signout\"],[11,\"class\",\"logout\"],[11,\"title\",\"Sign out of Screwdriver\"],[9],[0,\"Sign out\"],[3,\"action\",[[24,0,[]],\"invalidateSession\"]],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[5]},null]],\"parameters\":[4]},null]],\"parameters\":[]},{\"statements\":[[4,\"link-to\",[\"login\",[29,\"query-params\",null,[[\"fromUrl\"],[[25,[\"currentUrl\"]]]]]],[[\"title\",\"class\"],[\"Sign in to Screwdriver\",\"icon profile-outline\"]],{\"statements\":[[0,\"            \"],[1,[29,\"inline-svg\",[\"profile-outline\"],[[\"class\"],[\"img\"]]],false],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"icontitle\"],[9],[0,\"Sign in\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[]},null]],\"parameters\":[2]},null],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"tooltips\"],[9],[0,\"\\n  \"],[4,\"bs-tooltip\",null,[[\"placement\",\"triggerElement\",\"renderInPlace\"],[\"bottom\",\".icon.create\",true]],{\"statements\":[[0,\"Create a new Pipeline\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[4,\"each\",[[25,[\"scmContexts\"]]],null,{\"statements\":[[4,\"if\",[[24,1,[\"isSignedIn\"]]],null,{\"statements\":[[0,\"        \"],[4,\"bs-tooltip\",null,[[\"placement\",\"triggerElement\",\"triggerEvents\",\"renderInPlace\"],[\"bottom\",\".icon.profile-outline\",\"hover\",true]],{\"statements\":[[0,\"Currently signed in to a \"],[1,[24,1,[\"displayName\"]],false],[0,\" account.\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[4,\"bs-tooltip\",null,[[\"placement\",\"triggerElement\",\"renderInPlace\"],[\"bottom\",\".icon.profile-outline\",true]],{\"statements\":[[0,\"Sign in to Screwdriver\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/app-header/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/artifact-tree/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const ObjectPromiseProxy = Ember.ObjectProxy.extend(Ember.PromiseProxyMixin);
  const typesOptions = {
    directory: {
      icon: 'fa fa-folder-o fa-lg'
    },
    file: {
      icon: 'fa fa-file-text-o'
    }
  };

  var _default = Ember.Component.extend({
    artifact: Ember.inject.service('build-artifact'),
    classNames: ['artifact-tree'],
    classNameBindings: ['buildStatus'],
    typesOptions,
    plugins: 'types',
    treedata: Ember.computed('buildStatus', 'buildId', {
      get() {
        const {
          buildStatus
        } = this;

        if (buildStatus === 'RUNNING' || buildStatus === 'QUEUED') {
          return Ember.RSVP.resolve([]);
        }

        return ObjectPromiseProxy.create({
          promise: this.artifact.fetchManifest(this.buildId)
        });
      }

    }),
    actions: {
      handleJstreeEventDidChange(data) {
        if (data.node) {
          let {
            href
          } = data.node.a_attr;

          if (href !== '#') {
            window.open("".concat(href, "?download=true"), '_blank');
          }
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/artifact-tree/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "jbzs6EcT",
    "block": "{\"symbols\":[],\"statements\":[[7,\"h4\"],[9],[0,\"Artifacts\"],[10],[0,\"\\n\"],[1,[29,\"ember-jstree\",null,[[\"data\",\"plugins\",\"typesOptions\",\"eventDidChange\"],[[25,[\"treedata\",\"content\"]],[25,[\"plugins\"]],[25,[\"typesOptions\"]],[29,\"action\",[[24,0,[]],\"handleJstreeEventDidChange\"],null]]]],false],[0,\"\\n\"],[4,\"unless\",[[25,[\"treedata\",\"content\",\"length\"]]],null,{\"statements\":[[0,\"  \"],[7,\"span\"],[9],[0,\"No artifacts yet\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/artifact-tree/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/as-scrollable", ["exports", "ember-scrollable/components/ember-scrollable"], function (_exports, _emberScrollable) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberScrollable.default.extend({
    classNames: 'as-scrollable'
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/bread-crumbs/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/components/bread-crumbs/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "+GGADTcE",
    "block": "{\"symbols\":[\"crumb\",\"index\"],\"statements\":[[7,\"div\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"crumbs\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[24,2,[]],0],null]],null,{\"statements\":[[0,\"      \"],[4,\"link-to\",null,[[\"params\"],[[24,1,[\"params\"]]]],{\"statements\":[[1,[24,1,[\"name\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[24,1,[]],[25,[\"crumbs\",\"lastObject\"]]],null]],null,{\"statements\":[[0,\"        / \"],[1,[24,1,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        / \"],[4,\"link-to\",null,[[\"params\"],[[24,1,[\"params\"]]]],{\"statements\":[[1,[24,1,[\"name\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"parameters\":[1,2]},null],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/bread-crumbs/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/bs-accordion", ["exports", "ember-bootstrap/components/bs-accordion"], function (_exports, _bsAccordion) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsAccordion.default;
    }
  });
});
;define("screwdriver-ui/components/bs-accordion/item", ["exports", "ember-bootstrap/components/bs-accordion/item"], function (_exports, _item) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define("screwdriver-ui/components/bs-accordion/item/body", ["exports", "ember-bootstrap/components/bs-accordion/item/body"], function (_exports, _body) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
;define("screwdriver-ui/components/bs-accordion/item/title", ["exports", "ember-bootstrap/components/bs-accordion/item/title"], function (_exports, _title) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
;define("screwdriver-ui/components/bs-alert", ["exports", "ember-bootstrap/components/bs-alert"], function (_exports, _bsAlert) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsAlert.default;
    }
  });
});
;define("screwdriver-ui/components/bs-button-group", ["exports", "ember-bootstrap/components/bs-button-group"], function (_exports, _bsButtonGroup) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsButtonGroup.default;
    }
  });
});
;define("screwdriver-ui/components/bs-button-group/button", ["exports", "ember-bootstrap/components/bs-button-group/button"], function (_exports, _button) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
;define("screwdriver-ui/components/bs-button", ["exports", "ember-bootstrap/components/bs-button"], function (_exports, _bsButton) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsButton.default;
    }
  });
});
;define("screwdriver-ui/components/bs-carousel", ["exports", "ember-bootstrap/components/bs-carousel"], function (_exports, _bsCarousel) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsCarousel.default;
    }
  });
});
;define("screwdriver-ui/components/bs-carousel/slide", ["exports", "ember-bootstrap/components/bs-carousel/slide"], function (_exports, _slide) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _slide.default;
    }
  });
});
;define("screwdriver-ui/components/bs-collapse", ["exports", "ember-bootstrap/components/bs-collapse"], function (_exports, _bsCollapse) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsCollapse.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown", ["exports", "ember-bootstrap/components/bs-dropdown"], function (_exports, _bsDropdown) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsDropdown.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/button", ["exports", "ember-bootstrap/components/bs-dropdown/button"], function (_exports, _button) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _button.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/menu", ["exports", "ember-bootstrap/components/bs-dropdown/menu"], function (_exports, _menu) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _menu.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/menu/divider", ["exports", "ember-bootstrap/components/bs-dropdown/menu/divider"], function (_exports, _divider) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _divider.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/menu/item", ["exports", "ember-bootstrap/components/bs-dropdown/menu/item"], function (_exports, _item) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/menu/link-to", ["exports", "ember-bootstrap/components/bs-dropdown/menu/link-to"], function (_exports, _linkTo) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define("screwdriver-ui/components/bs-dropdown/toggle", ["exports", "ember-bootstrap/components/bs-dropdown/toggle"], function (_exports, _toggle) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form", ["exports", "ember-bootstrap/components/bs-form"], function (_exports, _bsForm) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsForm.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element", ["exports", "ember-bootstrap/components/bs-form/element"], function (_exports, _element) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/control", ["exports", "ember-bootstrap/components/bs-form/element/control"], function (_exports, _control) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _control.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/control/checkbox", ["exports", "ember-bootstrap/components/bs-form/element/control/checkbox"], function (_exports, _checkbox) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/control/input", ["exports", "ember-bootstrap/components/bs-form/element/control/input"], function (_exports, _input) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _input.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/control/radio", ["exports", "ember-bootstrap/components/bs-form/element/control/radio"], function (_exports, _radio) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _radio.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/control/textarea", ["exports", "ember-bootstrap/components/bs-form/element/control/textarea"], function (_exports, _textarea) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _textarea.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/errors", ["exports", "ember-bootstrap/components/bs-form/element/errors"], function (_exports, _errors) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _errors.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/feedback-icon", ["exports", "ember-bootstrap/components/bs-form/element/feedback-icon"], function (_exports, _feedbackIcon) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _feedbackIcon.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/help-text", ["exports", "ember-bootstrap/components/bs-form/element/help-text"], function (_exports, _helpText) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _helpText.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/label", ["exports", "ember-bootstrap/components/bs-form/element/label"], function (_exports, _label) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _label.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/horizontal", ["exports", "ember-bootstrap/components/bs-form/element/layout/horizontal"], function (_exports, _horizontal) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _horizontal.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/horizontal/checkbox", ["exports", "ember-bootstrap/components/bs-form/element/layout/horizontal/checkbox"], function (_exports, _checkbox) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/inline", ["exports", "ember-bootstrap/components/bs-form/element/layout/inline"], function (_exports, _inline) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _inline.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/inline/checkbox", ["exports", "ember-bootstrap/components/bs-form/element/layout/inline/checkbox"], function (_exports, _checkbox) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/vertical", ["exports", "ember-bootstrap/components/bs-form/element/layout/vertical"], function (_exports, _vertical) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _vertical.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/element/layout/vertical/checkbox", ["exports", "ember-bootstrap/components/bs-form/element/layout/vertical/checkbox"], function (_exports, _checkbox) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _checkbox.default;
    }
  });
});
;define("screwdriver-ui/components/bs-form/group", ["exports", "ember-bootstrap/components/bs-form/group"], function (_exports, _group) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _group.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal-simple", ["exports", "ember-bootstrap/components/bs-modal-simple"], function (_exports, _bsModalSimple) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsModalSimple.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal", ["exports", "ember-bootstrap/components/bs-modal"], function (_exports, _bsModal) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsModal.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/body", ["exports", "ember-bootstrap/components/bs-modal/body"], function (_exports, _body) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _body.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/dialog", ["exports", "ember-bootstrap/components/bs-modal/dialog"], function (_exports, _dialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _dialog.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/footer", ["exports", "ember-bootstrap/components/bs-modal/footer"], function (_exports, _footer) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _footer.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/header", ["exports", "ember-bootstrap/components/bs-modal/header"], function (_exports, _header) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _header.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/header/close", ["exports", "ember-bootstrap/components/bs-modal/header/close"], function (_exports, _close) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _close.default;
    }
  });
});
;define("screwdriver-ui/components/bs-modal/header/title", ["exports", "ember-bootstrap/components/bs-modal/header/title"], function (_exports, _title) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _title.default;
    }
  });
});
;define("screwdriver-ui/components/bs-nav", ["exports", "ember-bootstrap/components/bs-nav"], function (_exports, _bsNav) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsNav.default;
    }
  });
});
;define("screwdriver-ui/components/bs-nav/item", ["exports", "ember-bootstrap/components/bs-nav/item"], function (_exports, _item) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _item.default;
    }
  });
});
;define("screwdriver-ui/components/bs-nav/link-to", ["exports", "ember-bootstrap/components/bs-nav/link-to"], function (_exports, _linkTo) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define("screwdriver-ui/components/bs-navbar", ["exports", "ember-bootstrap/components/bs-navbar"], function (_exports, _bsNavbar) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsNavbar.default;
    }
  });
});
;define("screwdriver-ui/components/bs-navbar/content", ["exports", "ember-bootstrap/components/bs-navbar/content"], function (_exports, _content) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _content.default;
    }
  });
});
;define("screwdriver-ui/components/bs-navbar/link-to", ["exports", "ember-bootstrap/components/bs-navbar/link-to"], function (_exports, _linkTo) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _linkTo.default;
    }
  });
});
;define("screwdriver-ui/components/bs-navbar/nav", ["exports", "ember-bootstrap/components/bs-navbar/nav"], function (_exports, _nav) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _nav.default;
    }
  });
});
;define("screwdriver-ui/components/bs-navbar/toggle", ["exports", "ember-bootstrap/components/bs-navbar/toggle"], function (_exports, _toggle) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
});
;define("screwdriver-ui/components/bs-popover", ["exports", "ember-bootstrap/components/bs-popover"], function (_exports, _bsPopover) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsPopover.default;
    }
  });
});
;define("screwdriver-ui/components/bs-popover/element", ["exports", "ember-bootstrap/components/bs-popover/element"], function (_exports, _element) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define("screwdriver-ui/components/bs-progress", ["exports", "ember-bootstrap/components/bs-progress"], function (_exports, _bsProgress) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsProgress.default;
    }
  });
});
;define("screwdriver-ui/components/bs-progress/bar", ["exports", "ember-bootstrap/components/bs-progress/bar"], function (_exports, _bar) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bar.default;
    }
  });
});
;define("screwdriver-ui/components/bs-tab", ["exports", "ember-bootstrap/components/bs-tab"], function (_exports, _bsTab) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsTab.default;
    }
  });
});
;define("screwdriver-ui/components/bs-tab/pane", ["exports", "ember-bootstrap/components/bs-tab/pane"], function (_exports, _pane) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _pane.default;
    }
  });
});
;define("screwdriver-ui/components/bs-tooltip", ["exports", "ember-bootstrap/components/bs-tooltip"], function (_exports, _bsTooltip) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsTooltip.default;
    }
  });
});
;define("screwdriver-ui/components/bs-tooltip/element", ["exports", "ember-bootstrap/components/bs-tooltip/element"], function (_exports, _element) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _element.default;
    }
  });
});
;define("screwdriver-ui/components/build-banner/component", ["exports", "screwdriver-ui/utils/build"], function (_exports, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNames: ['build-banner', 'row'],
    classNameBindings: ['buildStatus'],
    coverage: Ember.inject.service(),
    coverageInfo: {},
    coverageStep: Ember.computed('buildSteps', {
      get() {
        const coverageStep = this.buildSteps.find(item => /^sd-teardown-screwdriver-coverage/.test(item.name));
        return coverageStep;
      }

    }),
    coverageStepEndTime: Ember.computed.alias('coverageStep.endTime'),
    prNumber: Ember.computed('event.pr.url', {
      get() {
        let url = this.get('event.pr.url');
        return url.split('/').pop();
      }

    }),
    shortenedPrShas: Ember.computed('prEvents', {
      get() {
        return this.prEvents.then(result => result.map((pr, i) => ({
          index: result.length - i,
          shortenedSha: pr.event.sha.substr(0, 7),
          build: pr.build,
          event: pr.event
        })));
      }

    }),
    buildAction: Ember.computed('buildStatus', {
      get() {
        if ((0, _build.isActiveBuild)(this.buildStatus, this.buildEnd)) {
          return 'Stop';
        }

        return 'Restart';
      }

    }),
    isWaiting: Ember.computed('buildStatus', {
      get() {
        return this.buildStatus === 'QUEUED';
      }

    }),
    hasButton: Ember.computed('buildAction', 'jobName', {
      get() {
        if (this.buildAction === 'Stop') {
          return true;
        }

        if ((0, _build.isPRJob)(this.jobName)) {
          return true;
        }

        return false;
      }

    }),

    overrideCoverageInfo() {
      const {
        buildMeta
      } = this; // override coverage info if set in build meta

      if (buildMeta && buildMeta.tests) {
        const coverage = String(buildMeta.tests.coverage);
        const tests = String(buildMeta.tests.results);
        let {
          coverageInfo
        } = this;

        if (coverage.match(/^\d+$/)) {
          coverageInfo.coverage = "".concat(coverage, "%");
          coverageInfo.coverageUrl = '#';
        }

        if (tests.match(/^\d+\/\d+$/)) {
          coverageInfo.tests = tests;
          coverageInfo.testsUrl = '#';
        }

        this.set('coverageInfo', coverageInfo);
      }
    },

    coverageInfoCompute() {
      // Set coverage query startTime to build start time since user can do coverage during user step
      const buildStartTime = this.buildSteps[0].startTime;
      const {
        coverageStepEndTime
      } = this;

      if (!coverageStepEndTime) {
        this.set('coverageInfo', {
          coverage: 'N/A',
          coverageUrl: '#',
          tests: 'N/A',
          testsUrl: '#'
        });
        return;
      }

      const config = {
        buildId: this.buildId,
        jobId: this.jobId,
        startTime: buildStartTime,
        endTime: coverageStepEndTime
      };
      this.coverage.getCoverageInfo(config).then(data => {
        this.set('coverageInfo', data);
        this.set('coverageInfoSet', true);
      });
    },

    init() {
      this._super(...arguments);

      this.set('coverageInfoSet', false);
      this.coverageInfoCompute();
      this.overrideCoverageInfo();
    },

    willRender() {
      this._super(...arguments);

      if ((0, _build.isActiveBuild)(this.buildStatus, this.buildEnd)) {
        this.reloadBuild();
      }

      if (this.coverageStepEndTime && !this.coverageInfoSet) {
        this.coverageInfoCompute();
      }

      if (!(0, _build.isActiveBuild)(this.buildStatus, this.buildEnd)) {
        this.overrideCoverageInfo();
      }
    },

    actions: {
      changeCurPr(targetPr) {
        this.changeBuild(targetPr.event.pipelineId, targetPr.build.id);
      },

      buildButtonClick() {
        if (this.buildAction === 'Stop') {
          this.onStop();
        } else {
          this.onStart();
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-banner/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "KJCpwypH",
    "block": "{\"symbols\":[\"dd\",\"ddm\",\"prSha\"],\"statements\":[[7,\"ul\"],[9],[0,\"\\n  \"],[7,\"li\"],[12,\"class\",[30,[\"job-name build-\",[23,\"buildStatus\"]]]],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[23,\"jobName\"],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Job\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"class\",\"commit\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-value commit-list\"],[9],[0,\"\\n      \"],[7,\"a\"],[12,\"href\",[25,[\"event\",\"commit\",\"url\"]]],[11,\"class\",\"sha commit-sha\"],[9],[0,\"#\"],[1,[25,[\"event\",\"truncatedSha\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"event\",\"pr\",\"url\"]]],null,{\"statements\":[[4,\"bs-dropdown\",null,null,{\"statements\":[[0,\"          \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"toggle\"]],\"expected `dd.toggle` to be a contextual component but found a string. Did you mean `(component dd.toggle)`? ('screwdriver-ui/components/build-banner/template.hbs' @ L11:C13) \"],null]],null,{\"statements\":[[0,\" \"],[7,\"span\"],[11,\"class\",\"caret caret-display\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/build-banner/template.hbs' @ L12:C13) \"],null]],null,{\"statements\":[[4,\"each\",[[29,\"await\",[[25,[\"shortenedPrShas\"]]],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"item\"]],\"expected `ddm.item` to be a contextual component but found a string. Did you mean `(component ddm.item)`? ('screwdriver-ui/components/build-banner/template.hbs' @ L14:C17) \"],null]],[[\"class\"],[\"pr-item\"]],{\"statements\":[[0,\"                \"],[7,\"a\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"changeCurPr\",[24,3,[]]],null]],[9],[1,[24,3,[\"index\"]],false],[0,\". \"],[1,[24,3,[\"shortenedSha\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Commit\"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"event\",\"pr\",\"url\"]]],null,{\"statements\":[[0,\"    \"],[7,\"li\"],[11,\"class\",\"pr\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-value pr-url-holder\"],[9],[0,\"\\n        \"],[7,\"a\"],[12,\"href\",[25,[\"event\",\"pr\",\"url\"]]],[11,\"class\",\"sha pr-url\"],[9],[0,\"\\n          \"],[1,[29,\"inline-svg\",[\"github\"],[[\"class\"],[\"pr-img\"]]],false],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"pr-link\"],[9],[0,\"PR#\"],[1,[23,\"prNumber\"],false],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Pull Request\"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[7,\"li\"],[11,\"class\",\"duration\"],[9],[0,\"\\n    \"],[7,\"details\"],[9],[0,\"\\n      \"],[7,\"summary\"],[9],[0,\"\\n        \"],[7,\"a\"],[11,\"class\",\"banner-value\"],[12,\"title\",[30,[\"Total duration: \",[23,\"duration\"],\", Blocked time: \",[23,\"blockDuration\"],\", Image pull time: \",[23,\"imagePullDuration\"],\", Build time: \",[23,\"buildDuration\"]]]],[9],[1,[23,\"duration\"],false],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"li\"],[11,\"class\",\"subsection\"],[9],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[23,\"blockDuration\"],false],[0,\" blocked\"],[10],[10],[0,\"\\n      \"],[7,\"li\"],[11,\"class\",\"subsection\"],[9],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[23,\"imagePullDuration\"],false],[0,\" pulling image\"],[10],[10],[0,\"\\n      \"],[7,\"li\"],[11,\"class\",\"subsection\"],[9],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[23,\"buildDuration\"],false],[0,\" in build\"],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[4,\"link-to\",[\"pipeline.metrics\",[29,\"query-params\",null,[[\"jobId\"],[[25,[\"jobId\"]]]]]],null,{\"statements\":[[0,\"See build metrics\"]],\"parameters\":[]},null],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Duration\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"class\",\"created\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[12,\"title\",[23,\"buildCreate\"]],[9],[1,[29,\"moment-format\",[[25,[\"buildCreate\"]],\"YYYY-MM-DD HH:mm:ss\"],null],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Create Time\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"class\",\"user\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[29,\"user-link\",null,[[\"user\",\"causeMessage\"],[[25,[\"event\",\"creator\"]],[25,[\"event\",\"causeMessage\"]]]]],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"User\"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"coverageStep\"]]],null,{\"statements\":[[0,\"    \"],[7,\"li\"],[11,\"class\",\"coverage\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[0,\"\\n        \"],[7,\"a\"],[12,\"href\",[25,[\"coverageInfo\",\"coverageUrl\"]]],[12,\"title\",[29,\"if\",[[29,\"eq\",[[25,[\"coverageInfo\",\"coverage\"]],\"N/A\"],null],\"Coverage report not generated\"],null]],[9],[0,\"\\n          \"],[1,[25,[\"coverageInfo\",\"coverage\"]],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Coverage\"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"li\"],[11,\"class\",\"tests\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[0,\"\\n        \"],[7,\"a\"],[12,\"href\",[25,[\"coverageInfo\",\"testsUrl\"]]],[12,\"title\",[29,\"if\",[[29,\"eq\",[[25,[\"coverageInfo\",\"tests\"]],\"N/A\"],null],\"Tests report not generated\"],null]],[9],[0,\"\\n          \"],[1,[25,[\"coverageInfo\",\"tests\"]],false],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Tests Passed\"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[7,\"li\"],[11,\"class\",\"docker-container\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-value\"],[9],[1,[23,\"buildContainer\"],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"banner-label\"],[9],[0,\"Container\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"li\"],[11,\"class\",\"call-to-action button-right\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"isAuthenticated\"]]],null,{\"statements\":[[0,\"      \"],[4,\"bs-button\",null,[[\"onClick\"],[[29,\"action\",[[24,0,[]],\"buildButtonClick\"],null]]],{\"statements\":[[1,[23,\"buildAction\"],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/build-banner/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-log/component", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const timeTypes = ['datetime', 'elapsedBuild', 'elapsedStep'];

  var _default = Ember.Component.extend({
    logService: Ember.inject.service('build-logs'),
    classNames: ['build-log'],
    autoscroll: true,
    isFetching: false,
    isDownloading: false,
    inProgress: false,
    justFinished: false,
    timeFormat: 'datetime',
    lastScrollTop: 0,
    lastScrollHeight: 0,
    // eslint-disable-next-line ember/no-observers
    inProgressObserver: Ember.observer('totalLine', function inProgressObserver() {
      const inProgress = this.totalLine === undefined; // step just finished

      if (this.inProgress && !inProgress) {
        this.set('justFinished', true);
      }

      this.set('inProgress', inProgress);
    }),
    sortOrder: Ember.computed('inProgress', {
      get() {
        return this.inProgress || this.justFinished ? 'ascending' : 'descending';
      }

    }),

    getPageSize(fetchMax = false) {
      const {
        totalLine,
        inProgress,
        justFinished
      } = this;
      let itemSize = this.logService.getCache(this.buildId, this.stepName, 'nextLine') || totalLine;

      if (justFinished) {
        itemSize = totalLine - itemSize + 1;
      } // for running step, fetch regular page size


      if (inProgress) {
        return _environment.default.APP.DEFAULT_LOG_PAGE_SIZE;
      } // For lazily loading old logs, if the number of log lines is too few on a page,
      // instead of having another fetch following right after the first render and user scrolls up,
      // we fetch an extra page of logs to have better UX
      // Or for the case with max fetch, calculate the remaining pages to fetch


      return fetchMax ? Math.ceil(itemSize / _environment.default.APP.MAX_LOG_LINES) : +(itemSize < _environment.default.APP.MAX_LOG_LINES || itemSize % _environment.default.APP.MAX_LOG_LINES < 100) + 1;
    },

    logs: Ember.computed('stepStartTime', 'isFetching', 'buildId', 'stepName', 'buildStatus', {
      get() {
        const {
          buildId,
          stepName,
          isFetching,
          buildStats,
          buildStatus
        } = this;
        const logs = this.logService.getCache(buildId, stepName, 'logs');
        const started = !!this.stepStartTime;

        if (!stepName) {
          return [{
            m: 'Click a step to see logs'
          }];
        } // Generate init step logs using build stats


        if (stepName === 'sd-setup-init') {
          const initLogs = [];
          initLogs.push({
            t: new Date(this.stepStartTime).getTime(),
            m: 'Build created.',
            n: 0
          });

          if (buildStatus === 'FROZEN') {
            initLogs.push({
              t: new Date(this.stepEndTime).getTime(),
              m: 'Build frozen and removed from the queue.',
              n: 1
            });
            return initLogs;
          }

          if (buildStats.queueEnterTime) {
            initLogs.push({
              t: new Date(buildStats.queueEnterTime).getTime(),
              m: 'Build enqueued.',
              n: 1
            });

            if (buildStatus === 'COLLAPSED') {
              initLogs.push({
                t: new Date(this.stepEndTime).getTime(),
                m: 'Build collapsed and removed from the queue.',
                n: 1
              });
              return initLogs;
            }

            if (buildStats.blockedStartTime) {
              initLogs.push({
                t: new Date(buildStats.blockedStartTime).getTime(),
                m: 'Build blocked, putting back into queue.',
                n: 1
              });
            }

            if (buildStats.hostname && buildStats.imagePullStartTime) {
              initLogs.push({
                t: new Date(buildStats.imagePullStartTime).getTime(),
                m: "Build scheduled on ".concat(buildStats.hostname, ". Starting image pull."),
                n: 2
              });
            }

            if (this.stepEndTime) {
              let msg = 'Image pull completed. Build init completed.'; // If build init succeeded and build starts, there should be buildStartTime

              if (!this.buildStartTime) {
                msg = 'Build init failed.';
              }

              initLogs.push({
                t: new Date(this.stepEndTime).getTime(),
                m: msg,
                n: 3
              });
              Ember.set(this, 'totalLine', 4);
            }

            return initLogs;
          } // If there is no build stat, update totalLine when step ends


          if (this.stepEndTime) {
            initLogs.push({
              t: new Date(this.stepEndTime).getTime(),
              m: 'Build init done.',
              n: 1
            });
            Ember.set(this, 'totalLine', 2);
          }

          return initLogs;
        }

        if (!logs) {
          if (!isFetching && started) {
            this.getLogs();
          }

          return [{
            m: "Loading logs for step ".concat(stepName, "...")
          }];
        }

        if (this.justFinished) {
          // there were logs in the cache, fetch the last batch of logs
          this.getLogs(true);
        }

        Ember.run.scheduleOnce('afterRender', this, 'scrollDown');
        return logs;
      }

    }),

    /**
     * Determines if log loading should occur
     * - step must have a defined start time (it is, or has executed)
     * - the step must have logs left to load
     * @property {Boolean} shouldLoad
     */
    shouldLoad: Ember.computed('isFetching', 'buildId', 'stepName', {
      get() {
        const name = this.stepName;

        if (!name) {
          return false;
        }

        return !this.logService.getCache(this.buildId, name, 'done');
      }

    }),

    init() {
      this._super(...arguments);

      const timeFormat = localStorage.getItem('screwdriver.logs.timeFormat');

      if (timeFormat && timeTypes.includes(timeFormat)) {
        Ember.set(this, 'timeFormat', timeFormat);
      }

      this.logService.resetCache();
      Ember.set(this, 'lastStepId', "".concat(this.buildId, "/").concat(this.stepName));
    },

    // Start loading logs immediately upon inserting the element if a step is selected
    didInsertElement() {
      this._super(...arguments);

      if (this.stepName) {
        this.getLogs();
      }
    },

    didReceiveAttrs() {
      this._super(...arguments);

      this.set('inProgress', this.totalLine === undefined);
    },

    didUpdateAttrs() {
      this._super(...arguments);

      const newStepId = "".concat(this.buildId, "/").concat(this.stepName);

      if (newStepId !== this.lastStepId) {
        this.setProperties({
          autoscroll: true,
          lastStepId: newStepId,
          lastScrollTop: 0,
          lastScrollHeight: 0,
          isDownloading: false,
          justFinished: false,
          inProgress: this.totalLine === undefined
        });
      }
    },

    /**
     * Remove scroll listener when component is destroyed
     * @method willDestroyElement
     */
    willDestroyElement() {
      this._super(...arguments);

      this.logService.resetCache();
    },

    /**
     * Scroll to the top of the page
     * @method scrollTop
     */
    scrollTop() {
      this.$('.wrap')[0].scrollTop = 0;
    },

    /**
     * Scroll to the bottom of the page
     * @method scrollDown
     */
    scrollDown() {
      if (this.autoscroll) {
        const bottom = this.$('.bottom').prop('offsetTop');
        this.$('.wrap').prop('scrollTop', bottom);
        Ember.set(this, 'lastScrollTop', bottom);
      }
    },

    /**
     * Scroll back to the last anchor point
     * @method scrollStill
     */
    scrollStill() {
      const container = this.$('.wrap')[0];
      Ember.set(this, 'lastScrollTop', container.scrollTop = this.lastScrollTop + (container.scrollHeight - this.lastScrollHeight));
    },

    /**
     * Fetch logs from log service
     * @method getLogs
     *
     * @param {boolean} fetchMax
     */
    getLogs(fetchMax = false) {
      if (!this.isFetching && this.shouldLoad) {
        const {
          buildId,
          stepName,
          totalLine
        } = this;
        const started = !!this.stepStartTime;
        Ember.set(this, 'isFetching', true);
        return this.logService.fetchLogs({
          buildId,
          stepName,
          logNumber: this.logService.getCache(buildId, stepName, 'nextLine') || (totalLine || 1) - 1,
          pageSize: this.getPageSize(fetchMax),
          sortOrder: this.sortOrder,
          started
        }).then(({
          done
        }) => {
          // prevent updating logs when component is being destroyed
          if (!this.isDestroyed && !this.isDestroying) {
            const container = this.$('.wrap')[0];
            const {
              inProgress,
              justFinished
            } = this;
            Ember.set(this, 'isFetching', false);
            Ember.set(this, 'lastScrollTop', container.scrollTop);
            Ember.set(this, 'lastScrollHeight', container.scrollHeight);
            let cb = 'scrollTop';

            if (!fetchMax) {
              cb = inProgress ? 'scrollDown' : 'scrollStill';
            }

            if (justFinished) {
              cb = 'scrollDown';
            }

            Ember.run.scheduleOnce('afterRender', this, cb);

            if ((justFinished || inProgress) && !done) {
              Ember.run.later(this, 'getLogs', justFinished, _environment.default.APP.LOG_RELOAD_TIMER);
            }
          }
        });
      }

      return Ember.RSVP.Promise.resolve();
    },

    actions: {
      scrollToTop() {
        Ember.set(this, 'autoscroll', false);

        if (!this.inProgress) {
          this.getLogs(true);
        }

        this.scrollTop();
      },

      scrollToBottom() {
        Ember.set(this, 'autoscroll', true);
        this.scrollDown();
      },

      download() {
        const {
          buildId,
          stepName
        } = this;

        if (this.logService.getCache(buildId, stepName, 'logs')) {
          Ember.set(this, 'isDownloading', true);
          this.getLogs(true).then(() => {
            this.$('#downloadLink').attr({
              download: "".concat(buildId, "-").concat(stepName, ".log"),
              href: this.logService.buildLogBlobUrl(buildId, stepName)
            })[0].click();
            Ember.set(this, 'isDownloading', false);
          });
        }
      },

      logScroll() {
        const container = this.$('.wrap')[0];

        if (!this.inProgress && !this.isFetching && !this.logService.getCache(this.buildId, this.stepName, 'done') && container.scrollTop < (container.scrollHeight - this.lastScrollHeight) / 2) {
          this.getLogs();
          return;
        } // autoscroll when the bottom of the logs is roughly in view


        Ember.set(this, 'autoscroll', this.$('.bottom')[0].getBoundingClientRect().top < 1500);
      },

      toggleTimeDisplay() {
        let index = timeTypes.indexOf(this.timeFormat);
        index = index + 1 >= timeTypes.length ? 0 : index + 1;
        localStorage.setItem('screwdriver.logs.timeFormat', timeTypes[index]);
        Ember.set(this, 'timeFormat', timeTypes[index]);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-log/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "8/wgr+BN",
    "block": "{\"symbols\":[\"log\",\"&default\"],\"statements\":[[4,\"if\",[[29,\"gt\",[[25,[\"logs\",\"length\"]],1],null]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"heading\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"time\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"toggleTimeDisplay\"],null]],[9],[0,\"\\n\"],[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"datetime\"],null]],null,{\"statements\":[[0,\"            Local Timestamp\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"elapsedBuild\"],null]],null,{\"statements\":[[0,\"            Since build started\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"elapsedStep\"],null]],null,{\"statements\":[[0,\"            Since step started\\n          \"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"content\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[9],[0,\"\\n        \"],[7,\"a\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"scrollToTop\"],null]],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-up\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"Go to Top\"],[10],[0,\"\\n        \"],[7,\"a\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"scrollToBottom\"],null]],[9],[7,\"i\"],[11,\"class\",\"fa fa-arrow-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"Go to Bottom\"],[10],[0,\"\\n\"],[4,\"unless\",[[25,[\"inProgress\"]]],null,{\"statements\":[[4,\"if\",[[25,[\"isDownloading\"]]],null,{\"statements\":[[0,\"            \"],[7,\"span\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-spinner fa-spin\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"Downloading\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[7,\"a\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"download\"],null]],[9],[7,\"i\"],[11,\"class\",\"fa fa-download\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"Download\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"          \"],[7,\"a\"],[11,\"id\",\"downloadLink\"],[11,\"href\",\"\"],[11,\"download\",\"\"],[11,\"hidden\",\"\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[15,2],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"wrap\"],[12,\"onScroll\",[29,\"action\",[[24,0,[]],\"logScroll\"],null]],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"logs\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"logs\"]]],null,{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"line\"],[9],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"time\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"toggleTimeDisplay\"],null]],[9],[0,\"\\n\"],[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"datetime\"],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"moment-format\",[[24,1,[\"t\"]],\"HH:mm:ss\"],null],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"elapsedBuild\"],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"x-duration\",[[25,[\"buildStartTime\"]],[24,1,[\"t\"]]],[[\"precision\"],[\"seconds\"]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"timeFormat\"]],\"elapsedStep\"],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"x-duration\",[[25,[\"stepStartTime\"]],[24,1,[\"t\"]]],[[\"precision\"],[\"seconds\"]]],false],[0,\"\\n          \"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"        \"],[10],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"content\"],[9],[1,[29,\"ansi-colorize\",[[24,1,[\"m\"]]],null],false],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"bottom\"],[9],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/build-log/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-step-collection/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    router: Ember.inject.service(),
    classNames: ['build-step-collection', 'row'],
    stepNames: Ember.computed.mapBy('buildSteps', 'name'),
    setupSteps: Ember.computed.filter('stepNames', item => /^sd-setup/.test(item)),
    teardownSteps: Ember.computed.filter('stepNames', item => /^sd-teardown/.test(item)),
    selectedStep: Ember.computed('buildSteps.@each.{code,startTime,endTime}', 'preselectedStepName', {
      get() {
        const steps = this.buildSteps;
        const preselectedStep = steps.findBy('name', this.preselectedStepName);

        if (preselectedStep) {
          return preselectedStep.name;
        }

        return null;
      }

    }),
    setupCollapsed: Ember.computed('selectedStep', {
      get() {
        const name = this.selectedStep;

        if (name && this.setupSteps.includes(name)) {
          return false;
        }

        return true;
      }

    }),
    teardownCollapsed: Ember.computed('selectedStep', {
      get() {
        const name = this.selectedStep;

        if (name && this.teardownSteps.includes(name)) {
          return false;
        }

        return true;
      }

    }),
    userSteps: Ember.computed.filter('stepNames', item => !/^sd-setup/.test(item) && !/^sd-teardown/.test(item)),
    actions: {
      toggleSetup() {
        Ember.set(this, 'setupCollapsed', !this.setupCollapsed);
      },

      toggleTeardown() {
        Ember.set(this, 'teardownCollapsed', !this.teardownCollapsed);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-step-collection/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "3hDR//hO",
    "block": "{\"symbols\":[\"step\",\"s\",\"step\",\"s\",\"step\",\"s\",\"&default\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-3 step-list\"],[9],[0,\"\\n    \"],[7,\"h3\"],[9],[0,\"Steps\"],[10],[0,\"\\n    \"],[7,\"a\"],[11,\"class\",\"step-toggle\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"toggleSetup\"],null]],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"setupCollapsed\"]]],null,{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-chevron-right\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-chevron-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      Setup\\n    \"],[10],[0,\"\\n\"],[4,\"bs-collapse\",null,[[\"collapsed\"],[[25,[\"setupCollapsed\"]]]],{\"statements\":[[0,\"      \"],[7,\"ul\"],[11,\"class\",\"setup indent\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"setupSteps\"]]],null,{\"statements\":[[4,\"with\",[[29,\"get-step-data\",[[25,[\"buildSteps\"]],[24,5,[]]],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\",\"stepEnd\",\"stepCode\",\"onClick\"],[[25,[\"selectedStep\"]],[24,6,[\"name\"]],[24,6,[\"startTime\"]],[24,6,[\"endTime\"]],[24,6,[\"code\"]],[29,\"action\",[[24,0,[]],[25,[\"changeBuildStep\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[6]},null]],\"parameters\":[5]},null],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[7,\"div\"],[11,\"class\",\"user-steps\"],[9],[0,\"\\n      \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"userSteps\"]]],null,{\"statements\":[[4,\"with\",[[29,\"get-step-data\",[[25,[\"buildSteps\"]],[24,3,[]]],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\",\"stepEnd\",\"stepCode\",\"onClick\"],[[25,[\"selectedStep\"]],[24,4,[\"name\"]],[24,4,[\"startTime\"]],[24,4,[\"endTime\"]],[24,4,[\"code\"]],[29,\"action\",[[24,0,[]],[25,[\"changeBuildStep\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[4]},null]],\"parameters\":[3]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"a\"],[11,\"class\",\"step-toggle\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"toggleTeardown\"],null]],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"teardownCollapsed\"]]],null,{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-chevron-right\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-chevron-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      Teardown\\n    \"],[10],[0,\"\\n\"],[4,\"bs-collapse\",null,[[\"collapsed\"],[[25,[\"teardownCollapsed\"]]]],{\"statements\":[[0,\"      \"],[7,\"ul\"],[11,\"class\",\"teardown indent\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"teardownSteps\"]]],null,{\"statements\":[[4,\"with\",[[29,\"get-step-data\",[[25,[\"buildSteps\"]],[24,1,[]]],null]],null,{\"statements\":[[0,\"            \"],[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\",\"stepEnd\",\"stepCode\",\"onClick\"],[[25,[\"selectedStep\"]],[24,2,[\"name\"]],[24,2,[\"startTime\"]],[24,2,[\"endTime\"]],[24,2,[\"code\"]],[29,\"action\",[[24,0,[]],[25,[\"changeBuildStep\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[7,\"hr\"],[9],[10],[0,\"\\n    \"],[1,[29,\"artifact-tree\",null,[[\"buildStatus\",\"buildId\"],[[25,[\"buildStatus\"]],[25,[\"buildId\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-9\"],[9],[0,\"\\n    \"],[1,[29,\"build-log\",null,[[\"stepName\",\"totalLine\",\"buildId\",\"stepStartTime\",\"stepEndTime\",\"buildStartTime\",\"buildStats\",\"buildStatus\"],[[25,[\"selectedStep\"]],[29,\"get-step-data\",[[25,[\"buildSteps\"]],[25,[\"selectedStep\"]],\"lines\"],null],[25,[\"buildId\"]],[29,\"get-step-data\",[[25,[\"buildSteps\"]],[25,[\"selectedStep\"]],\"startTime\"],null],[29,\"get-step-data\",[[25,[\"buildSteps\"]],[25,[\"selectedStep\"]],\"endTime\"],null],[25,[\"buildStart\"]],[25,[\"buildStats\"]],[25,[\"buildStatus\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[15,7],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/build-step-collection/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-step-item/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    tagName: 'li',
    classNameBindings: ['status', 'active'],
    active: Ember.computed('stepName', 'selectedStep', {
      get() {
        return this.stepName === this.selectedStep;
      }

    }),
    status: Ember.computed('stepCode', 'stepStart', {
      get() {
        const code = this.stepCode;
        const startTime = this.stepStart;

        if (!startTime) {
          return 'queued';
        }

        if ((code === undefined || code === null) && startTime) {
          return 'running';
        }

        return code === 0 ? 'success' : 'failure';
      }

    }),
    icon: Ember.computed('status', {
      get() {
        switch (this.status) {
          case 'running':
            return 'spinner fa-spin';

          case 'success':
            return 'check';

          case 'failure':
            return 'times';

          default:
            return 'circle-o';
        }
      }

    }),
    duration: Ember.computed('stepStart', 'stepEnd', {
      get() {
        const start = this.stepStart;
        const end = this.stepEnd;

        if (end && start) {
          const duration = Date.parse(end) - Date.parse(start);
          return humanizeDuration(duration, {
            round: true,
            largest: 2
          });
        }

        return null;
      }

    }),

    click() {
      this.onClick(this.stepName);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/build-step-item/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "47LCqOaP",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[23,\"icon\"]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[23,\"stepName\"],false],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"duration\"],[9],[1,[23,\"duration\"],false],[10],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/build-step-item/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/chart-c3/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    tagName: 'div',
    chart: null,

    didInsertElement() {
      this._super(...arguments);

      this.draw();
    },

    didUpdateAttrs() {
      this._super(...arguments);

      if (this.isDestroying || this.isDestroyed) {
        return;
      }

      const {
        chart
      } = this;
      chart.unload({
        done: () => {
          chart.destroy();
          this.draw();
        }
      });
    },

    willDestroyElement() {
      this._super(...arguments);

      this.chart.destroy();
      this.set('chart', null);
    },

    draw() {
      const chart = c3.generate({
        axis: this.axis,
        bar: this.bar,
        bindto: this.element,
        color: this.color,
        data: this.data,
        grid: this.grid,
        interaction: this.interaction,
        legend: this.legend,
        oninit: this.oninit,
        onrendered: this.onrendered,
        onresized: this.onresized,
        padding: this.padding,
        point: this.point,
        size: this.size,
        subchart: this.subchart,
        tooltip: this.tooltip,
        transition: this.transition,
        zoom: this.zoom
      });
      chart.internal.name = this.name;
      this.set('chart', chart);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-dropdown/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNames: ['collection-dropdown'],
    showCollectionModal: false,
    addCollectionError: null,
    addCollectionSuccess: null,
    actions: {
      openModal() {
        this.set('showCollectionModal', true);
      },

      addToCollection(pipelineId, collection) {
        return this.addToCollection(+pipelineId, collection.id).then(() => {
          this.set('addCollectionError', null);
          this.set('addCollectionSuccess', "Successfully added Pipeline to ".concat(collection.get('name')));
        }).catch(() => {
          this.set('addCollectionError', "Could not add Pipeline to ".concat(collection.get('name')));
          this.set('addCollectionSuccess', null);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-dropdown/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "tHvbfF+V",
    "block": "{\"symbols\":[\"dd\",\"menu\",\"collection\"],\"statements\":[[4,\"bs-dropdown\",null,null,{\"statements\":[[4,\"if\",[[25,[\"dropdownText\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"toggle\"]],\"expected `dd.toggle` to be a contextual component but found a string. Did you mean `(component dd.toggle)`? ('screwdriver-ui/components/collection-dropdown/template.hbs' @ L3:C7) \"],null]],null,{\"statements\":[[0,\"      \"],[7,\"a\"],[11,\"class\",\"toggler-text\"],[9],[0,\"\\n        \"],[1,[23,\"dropdownText\"],false],[7,\"span\"],[11,\"class\",\"caret caret-display\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"button\"]],\"expected `dd.button` to be a contextual component but found a string. Did you mean `(component dd.button)`? ('screwdriver-ui/components/collection-dropdown/template.hbs' @ L9:C7) \"],null]],[[\"class\"],[\"add-to-collection\"]],{\"statements\":[[0,\"      \"],[7,\"i\"],[11,\"class\",\"fa fa-sm fa-plus\"],[11,\"title\",\"Add to collection\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/collection-dropdown/template.hbs' @ L13:C5) \"],null]],[[\"align\",\"class\"],[\"right\",\"dropdown\"]],{\"statements\":[[4,\"each\",[[25,[\"collections\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"item\"]],\"expected `menu.item` to be a contextual component but found a string. Did you mean `(component menu.item)`? ('screwdriver-ui/components/collection-dropdown/template.hbs' @ L15:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"span\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"addToCollection\",[25,[\"pipeline\",\"id\"]],[24,3,[]]],null]],[9],[0,\"\\n          \"],[1,[24,3,[\"name\"]],false],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null],[0,\"    \"],[7,\"li\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"create-dropdown\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"openModal\"],null]],[9],[0,\"\\n        \"],[7,\"i\"],[11,\"class\",\"fa fa-md fa-plus-circle\"],[11,\"title\",\"Create\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" CREATE\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[1,[29,\"collection-modal\",null,[[\"showModal\",\"addNewCollection\",\"addToCollection\",\"pipelineId\"],[[25,[\"showCollectionModal\"]],[25,[\"addNewCollection\"]],[25,[\"addToCollection\"]],[25,[\"pipeline\",\"id\"]]]]],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/collection-dropdown/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-modal/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    name: null,
    description: null,
    errorMessage: null,
    store: Ember.inject.service(),
    actions: {
      setModal(open) {
        if (!open) {
          this.set('name', null);
          this.set('description', null);
          this.set('errorMessage', null);
        }

        this.set('showModal', open);
      },

      addNewCollection() {
        const {
          name,
          description
        } = this;
        Ember.run.schedule('actions', () => {
          const newCollection = this.store.createRecord('collection', {
            name,
            description
          });
          return newCollection.save().then(() => {
            this.set('showModal', false);
            let addDirectly = this.addToCollection;

            if (addDirectly) {
              addDirectly(this.pipelineId, newCollection.id);
            }
          }).catch(error => {
            newCollection.destroyRecord();
            this.set('errorMessage', error.errors[0].detail);
          });
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-modal/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "s9hvfQsh",
    "block": "{\"symbols\":[\"modal\",\"form\"],\"statements\":[[4,\"if\",[[25,[\"showModal\"]]],null,{\"statements\":[[4,\"bs-modal\",null,[[\"onHide\"],[[29,\"action\",[[24,0,[]],\"setModal\",false],null]]],{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"collection-modal\"],[9],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"header\"]],\"expected `modal.header` to be a contextual component but found a string. Did you mean `(component modal.header)`? ('screwdriver-ui/components/collection-modal/template.hbs' @ L5:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"h4\"],[11,\"class\",\"modal-title\"],[9],[0,\"Create New Collection\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"body\"]],\"expected `modal.body` to be a contextual component but found a string. Did you mean `(component modal.body)`? ('screwdriver-ui/components/collection-modal/template.hbs' @ L8:C9) \"],null]],null,{\"statements\":[[4,\"if\",[[25,[\"errorMessage\"]]],null,{\"statements\":[[0,\"          \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-form\",null,[[\"class\",\"onSubmit\"],[\"collection-form\",[29,\"action\",[[24,0,[]],\"addNewCollection\"],null]]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"group\"]],\"expected `form.group` to be a contextual component but found a string. Did you mean `(component form.group)`? ('screwdriver-ui/components/collection-modal/template.hbs' @ L13:C13) \"],null]],[[\"class\"],[\"name\"]],{\"statements\":[[0,\"            \"],[7,\"label\"],[11,\"class\",\"control-label\"],[9],[0,\"Collection Name\"],[10],[0,\"\\n            \"],[7,\"input\"],[12,\"value\",[23,\"name\"]],[11,\"class\",\"form-control\"],[12,\"oninput\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"name\"]]],null]],[[\"value\"],[\"target.value\"]]]],[11,\"placeholder\",\"Name\"],[11,\"type\",\"text\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"group\"]],\"expected `form.group` to be a contextual component but found a string. Did you mean `(component form.group)`? ('screwdriver-ui/components/collection-modal/template.hbs' @ L17:C13) \"],null]],[[\"class\"],[\"description\"]],{\"statements\":[[0,\"            \"],[7,\"label\"],[11,\"class\",\"control-label\"],[9],[0,\"Description\"],[10],[0,\"\\n            \"],[7,\"textarea\"],[12,\"value\",[23,\"description\"]],[11,\"class\",\"form-control description-input\"],[12,\"oninput\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"description\"]]],null]],[[\"value\"],[\"target.value\"]]]],[11,\"placeholder\",\"Description for the collection\"],[11,\"type\",\"text\"],[9],[10],[0,\"\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"group\"]],\"expected `form.group` to be a contextual component but found a string. Did you mean `(component form.group)`? ('screwdriver-ui/components/collection-modal/template.hbs' @ L21:C13) \"],null]],[[\"class\"],[\"footer\"]],{\"statements\":[[0,\"            \"],[4,\"bs-button\",null,[[\"buttonType\",\"class\",\"type\"],[\"submit\",\"collection-form__create\",\"primary\"]],{\"statements\":[[0,\"Save\"]],\"parameters\":[]},null],[0,\"            \"],[4,\"bs-button\",null,[[\"class\",\"onClick\",\"type\"],[\"collection-form__cancel\",[29,\"action\",[[24,0,[]],[24,1,[\"close\"]]],null],\"default\"]],{\"statements\":[[0,\"Cancel\"]],\"parameters\":[]},null],[0,\"\"]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/collection-modal/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-view/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    session: Ember.inject.service(),
    scmService: Ember.inject.service('scm'),
    sortBy: ['scmRepo.name'],
    removePipelineError: null,
    description: Ember.computed('collection', {
      get() {
        let description = this.get('collection.description');

        if (!description) {
          return 'Add a description';
        }

        return description;
      }

    }),
    sortedPipelines: Ember.computed.sort('collectionPipelines', 'sortBy'),
    sortByText: Ember.computed('sortBy', {
      get() {
        switch (this.sortBy.get(0)) {
          case 'scmRepo.name':
            return 'Name';

          case 'lastBuildTime:desc':
            return 'Last Build';

          default:
            return '';
        }
      }

    }),
    collectionPipelines: Ember.computed('collection.pipelines', {
      get() {
        const {
          scmService
        } = this;

        if (this.get('collection.pipelines')) {
          return this.get('collection.pipelines').map(pipeline => {
            const scm = scmService.getScm(pipeline.scmContext);
            const {
              id,
              scmRepo,
              workflow,
              lastBuilds,
              prs
            } = pipeline;
            const {
              branch,
              rootDir
            } = scmRepo;
            const ret = {
              id,
              scmRepo,
              branch: rootDir ? "".concat(branch, "#").concat(rootDir) : branch,
              scm: scm.displayName,
              scmIcon: scm.iconType,
              workflow,
              lastBuilds,
              prs
            };

            if (pipeline.lastBuilds && pipeline.lastBuilds.length) {
              const lastBuildsLength = pipeline.lastBuilds.length;
              const lastBuildObj = pipeline.lastBuilds[lastBuildsLength - 1];
              ret.lastBuildTime = new Date(lastBuildObj.createTime).valueOf();
              ret.lastBuildStatus = lastBuildObj.status.toLowerCase();
            } else {
              ret.lastBuildTime = 0;
              ret.lastBuildStatus = '';
            }

            [ret.lastBuildIcon, ret.lastBuildStatusColor] = (() => {
              switch (ret.lastBuildStatus) {
                case 'queued':
                case 'running':
                  return ['refresh fa-spin', 'build-running'];

                case 'success':
                  return ['check-circle', 'build-success'];

                case 'failure':
                  return ['times-circle', 'build-failure'];

                case 'aborted':
                  return ['stop-circle', 'build-failure'];

                case 'blocked':
                  return ['ban', 'build-running'];

                case 'unstable':
                  return ['exclamation-circle', 'build-unstable'];

                default:
                  return ['', ''];
              }
            })();

            return ret;
          });
        }

        return [];
      }

    }),
    actions: {
      /**
       * Action to remove a pipeline from a collection
       *
       * @param {Number} pipelineId - id of pipeline to remove
       * @param {Number} collectionId - id of collection to remove from
       * @returns {Promise}
       */
      pipelineRemove(pipelineId, collectionId) {
        return this.onPipelineRemove(+pipelineId, collectionId).then(() => {
          this.set('removePipelineError', null);
        }).catch(error => {
          this.set('removePipelineError', error.errors[0].detail);
        });
      },

      setSortBy(option) {
        switch (option) {
          case 'name':
            this.set('sortBy', ['scmRepo.name']);
            break;

          case 'lastBuildTime':
            this.set('sortBy', ["".concat(option, ":desc")]);
            break;

          default:
            this.set('sortBy', [option]);
        }
      },

      editDescription() {
        this.set('editingDescription', true);
      },

      editName() {
        this.set('editingName', true);
      },

      saveName() {
        const {
          collection
        } = this;
        let newName = this.$('.edit-area-name').val();

        if (newName) {
          collection.set('name', this.$('.edit-area-name').val());
          collection.save();
        }

        this.set('editingName', false);
      },

      saveDescription() {
        const {
          collection
        } = this;
        collection.set('description', this.$('.edit-area').val());
        this.set('editingDescription', false);
        collection.save();
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collection-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "naDZ5ND2",
    "block": "{\"symbols\":[\"pipeline\",\"dd\",\"menu\"],\"statements\":[[7,\"div\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"removePipelineError\"]]],null,{\"statements\":[[0,\"    \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"removePipelineError\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[7,\"div\"],[11,\"class\",\"header row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-md-7\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"editingName\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"name-edit\"],[9],[0,\"\\n          \"],[7,\"input\"],[11,\"class\",\"edit-area-name\"],[12,\"value\",[25,[\"collection\",\"name\"]]],[9],[10],[0,\"\\n          \"],[7,\"button\"],[11,\"class\",\"save-name btn btn-primary\"],[9],[0,\"Save\"],[3,\"action\",[[24,0,[]],\"saveName\"]],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"h2\"],[11,\"class\",\"header__name\"],[9],[1,[25,[\"collection\",\"name\"]],false],[0,\" \"],[7,\"a\"],[11,\"class\",\"edit-icon move-left\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"editName\"],null]],[9],[7,\"i\"],[11,\"class\",\"fa fa-pencil\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[10],[0,\"\\n\"]],\"parameters\":[]}],[4,\"if\",[[25,[\"editingDescription\"]]],null,{\"statements\":[[0,\"        \"],[7,\"textarea\"],[11,\"class\",\"edit-area\"],[9],[1,[25,[\"collection\",\"description\"]],false],[10],[0,\"        \"],[7,\"button\"],[11,\"class\",\"save btn btn-primary\"],[9],[0,\"Save\"],[3,\"action\",[[24,0,[]],\"saveDescription\"]],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"collection\",\"description\"]]],null,{\"statements\":[[0,\"          \"],[7,\"div\"],[9],[0,\"\\n            \"],[7,\"p\"],[11,\"class\",\"header__description\"],[9],[1,[25,[\"collection\",\"description\"]],false],[7,\"a\"],[11,\"class\",\"edit-icon\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"editDescription\"],null]],[9],[7,\"i\"],[11,\"class\",\"fa fa-pencil\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"          \"],[7,\"p\"],[11,\"class\",\"description-placeholder\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"editDescription\"],null]],[9],[0,\"Add a description\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"header__sort-pipelines col-md-5\"],[9],[0,\"\\n      Sort By\\n\"],[4,\"bs-dropdown\",null,null,{\"statements\":[[0,\"        \"],[4,\"bs-button\",null,null,{\"statements\":[[1,[23,\"sortByText\"],false]],\"parameters\":[]},null],[0,\"\\n        \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"button\"]],\"expected `dd.button` to be a contextual component but found a string. Did you mean `(component dd.button)`? ('screwdriver-ui/components/collection-view/template.hbs' @ L32:C11) \"],null]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"menu\"]],\"expected `dd.menu` to be a contextual component but found a string. Did you mean `(component dd.menu)`? ('screwdriver-ui/components/collection-view/template.hbs' @ L33:C11) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `menu.item` to be a contextual component but found a string. Did you mean `(component menu.item)`? ('screwdriver-ui/components/collection-view/template.hbs' @ L34:C13) \"],null]],null,{\"statements\":[[0,\"            \"],[7,\"a\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"setSortBy\",\"name\"],null]],[9],[0,\"Name\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `menu.item` to be a contextual component but found a string. Did you mean `(component menu.item)`? ('screwdriver-ui/components/collection-view/template.hbs' @ L37:C13) \"],null]],null,{\"statements\":[[0,\"            \"],[7,\"a\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"setSortBy\",\"lastBuildTime\"],null]],[9],[0,\"Last Build\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null]],\"parameters\":[2]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"collection-table row\"],[9],[0,\"\\n    \"],[7,\"table\"],[11,\"class\",\"col-md-10\"],[9],[0,\"\\n      \"],[7,\"thead\"],[9],[0,\"\\n        \"],[7,\"tr\"],[9],[0,\"\\n          \"],[7,\"th\"],[11,\"class\",\"app-id\"],[11,\"rowspan\",\"2\"],[9],[0,\"Name\"],[10],[0,\"\\n          \"],[7,\"th\"],[11,\"class\",\"branch\"],[11,\"rowspan\",\"2\"],[9],[0,\"Branch\"],[10],[0,\"\\n          \"],[7,\"th\"],[11,\"class\",\"account\"],[11,\"rowspan\",\"2\"],[9],[0,\"Account\"],[10],[0,\"\\n          \"],[7,\"th\"],[11,\"class\",\"health\"],[11,\"rowspan\",\"2\"],[9],[0,\"Last Build\"],[10],[0,\"\\n          \"],[7,\"th\"],[11,\"class\",\"prs\"],[11,\"colspan\",\"2\"],[9],[0,\"Pull Requests\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"            \"],[7,\"th\"],[11,\"rowspan\",\"2\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[10],[0,\"\\n        \"],[7,\"tr\"],[9],[0,\"\\n          \"],[7,\"th\"],[9],[0,\"Open\"],[10],[0,\"\\n          \"],[7,\"th\"],[9],[0,\"Failing\"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"sortedPipelines\"]]],null,{\"statements\":[[0,\"          \"],[7,\"tr\"],[11,\"class\",\"collection-pipeline\"],[9],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"app-id\"],[9],[0,\"\\n              \"],[4,\"highlight-terms\",[[25,[\"query\"]]],null,{\"statements\":[[4,\"link-to\",[\"pipeline\",[24,1,[\"id\"]]],null,{\"statements\":[[1,[24,1,[\"scmRepo\",\"name\"]],false]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"branch\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"aria-hidden\",\"true\"],[9],[10],[1,[24,1,[\"branch\"]],false],[10],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"account\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[24,1,[\"scmIcon\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[24,1,[\"scm\"]],false],[10],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"health\"],[9],[0,\"\\n              \"],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[24,1,[\"lastBuildIcon\"]],\" \",[24,1,[\"lastBuildStatusColor\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"prs--open\"],[9],[0,\"\\n\"],[4,\"if\",[[24,1,[\"prs\"]]],null,{\"statements\":[[0,\"                \"],[1,[24,1,[\"prs\",\"open\"]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n            \"],[7,\"td\"],[11,\"class\",\"prs--failing\"],[9],[0,\"\\n\"],[4,\"if\",[[24,1,[\"prs\"]]],null,{\"statements\":[[0,\"                \"],[1,[24,1,[\"prs\",\"failing\"]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"            \"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"              \"],[7,\"td\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"pipelineRemove\",[24,1,[\"id\"]],[25,[\"collection\",\"id\"]]],null]],[11,\"class\",\"collection-pipeline__remove\"],[9],[0,\"\\n                \"],[7,\"span\"],[9],[0,\"\\n                  ×\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/collection-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collections-flyout/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    session: Ember.inject.service(),
    store: Ember.inject.service(),
    collectionToDelete: null,
    showConfirmation: false,
    showDeleteButtons: false,
    showModal: false,
    collections: Ember.computed('store', {
      get() {
        if (!Ember.get(this, 'session.isAuthenticated') || Ember.get(this, 'session.data.authenticated.isGuest')) {
          return [];
        }

        return this.store.findAll('collection');
      }

    }),
    actions: {
      changeCollectionDisplayed() {
        this.changeCollection();
      },

      openModal() {
        this.set('showModal', true);
      },

      /**
       * Action to cancel the deletion of a collection
       */
      cancelDeletingCollection() {
        this.set('collectionToDelete', null);
      },

      /**
       * Action to delete a collection
       * @param {collection} collection - the collection to delete
       */
      deleteCollection(collection) {
        const c = this.store.peekRecord('collection', collection.id);
        return c.destroyRecord().then(() => {
          this.set('collectionToDelete', null);

          if (typeof this.onDeleteCollection === 'function') {
            this.onDeleteCollection();
          }
        });
      },

      /**
       * Action to set a collection to be deleted
       * @param {collection} collection - the collection to set for deletion
       */
      setCollectionToDelete(collection) {
        this.set('collectionToDelete', collection);
      },

      /**
       * Action to open / close the create collection modal
       * @param {boolean} open - whether modal should be open
       */
      toggleEdit() {
        this.set('showDeleteButtons', !this.showDeleteButtons);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/collections-flyout/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "NyR0KdKe",
    "block": "{\"symbols\":[\"collection\"],\"statements\":[[7,\"div\"],[11,\"class\",\"flyout row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"header row\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"      \"],[7,\"h2\"],[11,\"class\",\"header__text col-xs-9\"],[9],[0,\"\\n        \"],[7,\"a\"],[11,\"class\",\"new\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-md fa-plus-circle\"],[11,\"title\",\"Create a collection\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"openModal\"]],[10],[0,\" Collections\\n      \"],[10],[0,\"\\n      \"],[7,\"a\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"toggleEdit\"],null]],[11,\"class\",\"header__edit col-xs-3\"],[9],[0,\"Edit\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[7,\"h2\"],[11,\"class\",\"header__text col-xs-12\"],[9],[0,\"\\n        Collections\\n      \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"  \"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"collections\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[12,\"class\",[30,[\"collection-wrapper row \",[29,\"if\",[[29,\"eq\",[[24,1,[\"id\"]],[25,[\"selectedCollectionId\"]]],null],\" row--active\"],null]]]],[9],[0,\"\\n\"],[4,\"link-to\",[\"dashboard.show\",[24,1,[\"id\"]]],[[\"invokeAction\"],[\"changeCollectionDisplayed\"]],{\"statements\":[[0,\"        \"],[1,[24,1,[\"name\"]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"showDeleteButtons\"]]],null,{\"statements\":[[0,\"        \"],[7,\"button\"],[11,\"class\",\"collection-wrapper__delete\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"setCollectionToDelete\",[24,1,[]]],null]],[9],[0,\"\\n          \"],[7,\"i\"],[11,\"class\",\"fa fa-md fa-trash\"],[11,\"title\",\"Delete collection\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},{\"statements\":[[0,\"    \"],[7,\"p\"],[11,\"class\",\"no-collections-text\"],[9],[0,\"No collections to display.\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[4,\"if\",[[25,[\"collectionToDelete\"]]],null,{\"statements\":[[4,\"bs-modal-simple\",null,[[\"title\",\"closeTitle\",\"submitTitle\",\"size\",\"fade\",\"onSubmit\",\"onHide\"],[\"Please confirm\",\"Cancel\",\"Confirm\",null,false,[29,\"action\",[[24,0,[]],\"deleteCollection\",[25,[\"collectionToDelete\"]]],null],[29,\"action\",[[24,0,[]],\"cancelDeletingCollection\"],null]]],{\"statements\":[[0,\"      You're about to delete \"],[1,[25,[\"collectionToDelete\",\"name\"]],false],[0,\". Are you sure?\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"  \"],[1,[29,\"collection-modal\",null,[[\"showModal\"],[[25,[\"showModal\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/collections-flyout/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-format/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    isHabitat: Ember.computed('command', {
      get() {
        return this.get('command.format') === 'habitat';
      }

    }),
    isDocker: Ember.computed('command', {
      get() {
        return this.get('command.format') === 'docker';
      }

    }),
    isBinary: Ember.computed('command', {
      get() {
        return this.get('command.format') === 'binary';
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-format/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "LQk47Gmt",
    "block": "{\"symbols\":[],\"statements\":[[7,\"h4\"],[9],[0,\"Format: \"],[1,[25,[\"command\",\"format\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"isHabitat\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"mode\"],[11,\"title\",\"This is the habitat mode.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Mode:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"habitat\",\"mode\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"package\"],[11,\"title\",\"This is the habitat package.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Package:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"habitat\",\"package\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"habitat-command\"],[11,\"title\",\"This is the habitat command.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Command:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"habitat\",\"command\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"isDocker\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"image\"],[11,\"title\",\"This is the docker image.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Image:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"docker\",\"image\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"docker-command\"],[11,\"title\",\"This is the docker command.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Command:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"docker\",\"command\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"isBinary\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"file\"],[11,\"title\",\"This is the binary file.\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"File:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"command\",\"binary\",\"file\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"span\"],[9],[0,\"Unknown type of format\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"parameters\":[]}]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/command-format/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-header/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    commandToRemove: null,
    scmUrl: null,
    isRemoving: false,
    store: Ember.inject.service(),

    init() {
      this._super(...arguments);

      this.store.findRecord('pipeline', this.command.pipelineId).then(pipeline => {
        this.set('scmUrl', pipeline.get('scmRepo.url'));
      }).catch(() => {
        this.set('scmUrl', null);
      });
    },

    actions: {
      setCommandToRemove(command) {
        this.set('commandToRemove', command);
      },

      cancelRemovingCommand() {
        this.set('commandToRemove', null);
        this.set('isRemoving', false);
      },

      removeCommand(namespace, name) {
        this.set('isRemoving', true);
        this.onRemoveCommand(namespace, name).then(() => {
          this.set('commandToRemove', null);
          this.set('isRemoving', false);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-header/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "GCFBOv1I",
    "block": "{\"symbols\":[\"modal\"],\"statements\":[[7,\"h1\"],[9],[0,\"\\n  \"],[1,[25,[\"command\",\"namespace\"]],false],[0,\"/\"],[1,[25,[\"command\",\"name\"]],false],[0,\"\\n\"],[4,\"if\",[[25,[\"scmUrl\"]]],null,{\"statements\":[[0,\"    \"],[7,\"a\"],[12,\"href\",[23,\"scmUrl\"]],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"title\",\"Source code\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"remove\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"title\",\"Delete template\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"setCommandToRemove\",[25,[\"command\"]]]],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"title\",\"The pipeline for this command does not exist.\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"title\",\"Cannot delete command; pipeline could not be found.\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[10],[0,\"\\n\"],[7,\"h2\"],[9],[1,[25,[\"command\",\"version\"]],false],[10],[0,\"\\n\"],[7,\"p\"],[9],[1,[25,[\"command\",\"description\"]],false],[10],[0,\"\\n\"],[7,\"ul\"],[9],[0,\"\\n  \"],[7,\"li\"],[9],[0,\"Released by: \"],[7,\"a\"],[12,\"href\",[30,[\"mailto:\",[25,[\"command\",\"maintainer\"]]]]],[9],[1,[25,[\"command\",\"maintainer\"]],false],[10],[10],[0,\"\\n  \"],[4,\"if\",[[25,[\"command\",\"lastUpdated\"]]],null,{\"statements\":[[7,\"li\"],[9],[0,\"Last published: \"],[1,[25,[\"command\",\"lastUpdated\"]],false],[10]],\"parameters\":[]},null],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"h4\"],[9],[0,\"Usage:\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"command\",\"usage\"]]],null,{\"statements\":[[0,\"  \"],[7,\"pre\"],[9],[1,[25,[\"command\",\"usage\"]],false],[10],[0,\"\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"pre\"],[9],[0,\"sd-cmd exec \"],[1,[25,[\"command\",\"namespace\"]],false],[0,\"/\"],[1,[25,[\"command\",\"name\"]],false],[0,\"@\"],[1,[25,[\"command\",\"version\"]],false],[10],[0,\"\"]],\"parameters\":[]}],[4,\"if\",[[25,[\"commandToRemove\"]]],null,{\"statements\":[[4,\"if\",[[25,[\"isRemoving\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[\"false\",\"center\",true]],{\"statements\":[[0,\"      \"],[1,[23,\"loading-view\"],false],[0,\"\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"bs-modal\",null,[[\"onSubmit\",\"onHide\"],[[29,\"action\",[[24,0,[]],\"removeCommand\",[25,[\"command\",\"namespace\"]],[25,[\"command\",\"name\"]]],null],[29,\"action\",[[24,0,[]],\"cancelRemovingCommand\"],null]]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"header\"]],\"expected `modal.header` to be a contextual component but found a string. Did you mean `(component modal.header)`? ('screwdriver-ui/components/command-header/template.hbs' @ L32:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"h4\"],[9],[0,\"Are you sure?\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"body\"]],\"expected `modal.body` to be a contextual component but found a string. Did you mean `(component modal.body)`? ('screwdriver-ui/components/command-header/template.hbs' @ L35:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-3x fa-exclamation-triangle fa-pull-left\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n        You're about to delete all versions and tags of \"],[7,\"strong\"],[9],[1,[25,[\"command\",\"namespace\"]],false],[0,\"/\"],[1,[25,[\"command\",\"name\"]],false],[10],[0,\". There might be existing pipelines using this command.\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"footer\"]],\"expected `modal.footer` to be a contextual component but found a string. Did you mean `(component modal.footer)`? ('screwdriver-ui/components/command-header/template.hbs' @ L39:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[4,\"bs-button\",null,[[\"onClick\"],[[29,\"action\",[[24,0,[]],\"cancelRemovingCommand\"],null]]],{\"statements\":[[0,\"Cancel\"]],\"parameters\":[]},null],[0,\"\\n        \"],[4,\"bs-button\",null,[[\"onClick\",\"type\"],[[29,\"action\",[[24,0,[]],\"removeCommand\",[25,[\"command\",\"namespace\"]],[25,[\"command\",\"name\"]]],null],\"danger\"]],{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Confirm\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/command-header/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-versions/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/components/command-versions/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "sLuAjXYP",
    "block": "{\"symbols\":[\"c\"],\"statements\":[[7,\"h4\"],[9],[0,\"Versions:\"],[10],[0,\"\\n\"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"commands\"]]],null,{\"statements\":[[0,\"    \"],[7,\"li\"],[9],[7,\"span\"],[11,\"class\",\"version\"],[9],[1,[24,1,[\"version\"]],false],[4,\"if\",[[24,1,[\"tag\"]]],null,{\"statements\":[[0,\" - \"],[1,[24,1,[\"tag\"]],false]],\"parameters\":[]},null],[3,\"action\",[[24,0,[]],[25,[\"changeVersion\"]],[24,1,[\"version\"]]],[[\"on\"],[\"click\"]]],[10],[4,\"if\",[[24,1,[\"lastUpdated\"]]],null,{\"statements\":[[0,\" \"],[1,[24,1,[\"lastUpdated\"]],false]],\"parameters\":[]},null],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/command-versions/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/ember-ace-completion-tooltip", ["exports", "ember-ace/components/ember-ace-completion-tooltip"], function (_exports, _emberAceCompletionTooltip) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberAceCompletionTooltip.default;
    }
  });
});
;define("screwdriver-ui/components/ember-ace", ["exports", "ember-ace/components/ember-ace"], function (_exports, _emberAce) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberAce.default;
    }
  });
});
;define("screwdriver-ui/components/ember-flatpickr", ["exports", "ember-flatpickr/components/ember-flatpickr"], function (_exports, _emberFlatpickr) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberFlatpickr.default;
    }
  });
});
;define("screwdriver-ui/components/ember-jstree", ["exports", "ember-cli-jstree/components/ember-jstree"], function (_exports, _emberJstree) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberJstree.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog-positioned-container", ["exports", "ember-modal-dialog/components/positioned-container"], function (_exports, _positionedContainer) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _positionedContainer.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog/-basic-dialog", ["exports", "ember-modal-dialog/components/basic-dialog"], function (_exports, _basicDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _basicDialog.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog/-in-place-dialog", ["exports", "ember-modal-dialog/components/in-place-dialog"], function (_exports, _inPlaceDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _inPlaceDialog.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog/-liquid-dialog", ["exports", "ember-modal-dialog/components/liquid-dialog"], function (_exports, _liquidDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _liquidDialog.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog/-liquid-tether-dialog", ["exports", "ember-modal-dialog/components/liquid-tether-dialog"], function (_exports, _liquidTetherDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _liquidTetherDialog.default;
    }
  });
});
;define("screwdriver-ui/components/ember-modal-dialog/-tether-dialog", ["exports", "ember-modal-dialog/components/tether-dialog"], function (_exports, _tetherDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _tetherDialog.default;
    }
  });
});
;define("screwdriver-ui/components/ember-popper-targeting-parent", ["exports", "ember-popper/components/ember-popper-targeting-parent"], function (_exports, _emberPopperTargetingParent) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
;define("screwdriver-ui/components/ember-popper", ["exports", "ember-popper/components/ember-popper"], function (_exports, _emberPopper) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
;define("screwdriver-ui/components/ember-scrollable", ["exports", "ember-scrollable/components/ember-scrollable"], function (_exports, _emberScrollable) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberScrollable.default;
    }
  });
});
;define("screwdriver-ui/components/ember-scrollbar", ["exports", "ember-scrollable/components/ember-scrollbar"], function (_exports, _emberScrollbar) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberScrollbar.default;
    }
  });
});
;define("screwdriver-ui/components/ember-wormhole", ["exports", "ember-wormhole/components/ember-wormhole"], function (_exports, _emberWormhole) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberWormhole.default;
    }
  });
});
;define("screwdriver-ui/components/error-view/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    errorMessage: ''
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/error-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "3eEiqI9n",
    "block": "{\"symbols\":[],\"statements\":[[7,\"h1\"],[9],[1,[23,\"statusCode\"],false],[10],[7,\"h2\"],[9],[1,[23,\"statusMessage\"],false],[10],[0,\"\\n\"],[7,\"h4\"],[9],[1,[23,\"errorMessage\"],false],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/error-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/highlight-terms", ["exports", "ember-highlight/components/highlight-terms/component"], function (_exports, _component) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
;define("screwdriver-ui/components/home-hero/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /* eslint-disable max-len */
  const langs = [{
    name: 'node.js',
    url: 'https://github.com/screwdriver-cd-test/quickstart-nodejs'
  }, {
    name: 'ruby',
    url: 'https://github.com/screwdriver-cd-test/quickstart-ruby'
  }, {
    name: 'go',
    url: 'https://github.com/screwdriver-cd-test/quickstart-golang'
  }, {
    name: 'generic',
    url: 'https://github.com/screwdriver-cd-test/quickstart-generic'
  }];
  /* eslint-enable max-len */

  var _default = Ember.Component.extend({
    languages: langs,
    actions: {
      changeLanguage() {
        this.set('forkUrl', this.$('select').val());
      }

    },
    forkUrl: langs[0].url
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/home-hero/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "txS2UQ7u",
    "block": "{\"symbols\":[\"lang\"],\"statements\":[[7,\"div\"],[11,\"class\",\"top\"],[9],[0,\"\\n  \"],[1,[29,\"inline-svg\",[\"Screwdriver_Icon_Full\"],[[\"class\"],[\"img\"]]],false],[0,\"\\n  \"],[7,\"h1\"],[9],[0,\"Introducing Screwdriver\"],[10],[0,\"\\n  \"],[7,\"span\"],[9],[0,\"Build. Test. Deliver.\"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"start\"],[9],[0,\"\\n  \"],[7,\"div\"],[9],[0,\"\\n    \"],[7,\"h2\"],[9],[0,\"Getting started, by the numbers...\"],[10],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n      \"],[7,\"li\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"num\"],[9],[7,\"span\"],[9],[0,\"1\"],[10],[10],[0,\"\\n        \"],[7,\"span\"],[9],[0,\"\\n          For\\n          \"],[7,\"select\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"languages\"]]],null,{\"statements\":[[0,\"              \"],[7,\"option\"],[12,\"value\",[24,1,[\"url\"]]],[9],[1,[24,1,[\"name\"]],false],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"          \"],[3,\"action\",[[24,0,[]],\"changeLanguage\"],[[\"on\"],[\"change\"]]],[10],[0,\",\\n          \"],[7,\"a\"],[12,\"href\",[23,\"forkUrl\"]],[11,\"target\",\"_blank\"],[11,\"rel\",\"noopener\"],[9],[7,\"span\"],[9],[0,\"fork this repo\"],[10],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"id\",\"langList\"],[9],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"li\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"num\"],[9],[7,\"span\"],[9],[0,\"2\"],[10],[10],[0,\"\\n        \"],[7,\"span\"],[9],[4,\"link-to\",[\"create\"],null,{\"statements\":[[0,\"Create a new pipeline\"]],\"parameters\":[]},null],[0,\" with your repo\"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"li\"],[9],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"num\"],[9],[7,\"span\"],[9],[0,\"3\"],[10],[10],[0,\"\\n        \"],[7,\"span\"],[9],[0,\"Click the start button on your new pipeline\"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/home-hero/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/info-message/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    type: 'info',
    actions: {
      clearMessage: function clearMessage() {
        this.set('message', null);
      }
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/info-message/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "vLguei2u",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"message\"]]],null,{\"statements\":[[4,\"bs-alert\",null,[[\"onDismissed\",\"type\"],[[29,\"action\",[[24,0,[]],\"clearMessage\"],null],[25,[\"type\"]]]],{\"statements\":[[0,\"    \"],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[23,\"icon\"]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[7,\"span\"],[9],[1,[23,\"message\"],false],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/info-message/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/job-toggle-modal/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    message: null,
    errorMessage: null,
    store: Ember.inject.service(),
    actions: {
      setModal(open) {
        if (!open) {
          this.set('message', null);
          this.set('errorMessage', null);
        }

        this.set('showToggleModal', open);
      },

      updateState() {
        Ember.run.schedule('actions', () => {
          let addMessage = this.updateMessage;

          if (addMessage) {
            addMessage(this.message);
          }

          this.set('showToggleModal', false);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/job-toggle-modal/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "ICpHnI54",
    "block": "{\"symbols\":[\"modal\",\"form\"],\"statements\":[[4,\"if\",[[25,[\"showToggleModal\"]]],null,{\"statements\":[[4,\"bs-modal\",null,[[\"onHide\"],[[29,\"action\",[[24,0,[]],\"setModal\",false],null]]],{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"toggle-modal\"],[9],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"header\"]],\"expected `modal.header` to be a contextual component but found a string. Did you mean `(component modal.header)`? ('screwdriver-ui/components/job-toggle-modal/template.hbs' @ L4:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"h4\"],[11,\"class\",\"modal-title\"],[9],[1,[23,\"stateChange\"],false],[0,\" the \\\"\"],[1,[23,\"name\"],false],[0,\"\\\" job?\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"body\"]],\"expected `modal.body` to be a contextual component but found a string. Did you mean `(component modal.body)`? ('screwdriver-ui/components/job-toggle-modal/template.hbs' @ L7:C9) \"],null]],null,{\"statements\":[[4,\"if\",[[25,[\"errorMessage\"]]],null,{\"statements\":[[0,\"          \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"bs-form\",null,[[\"class\",\"onSubmit\"],[\"toggle-form\",[29,\"action\",[[24,0,[]],\"updateState\"],null]]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"group\"]],\"expected `form.group` to be a contextual component but found a string. Did you mean `(component form.group)`? ('screwdriver-ui/components/job-toggle-modal/template.hbs' @ L12:C13) \"],null]],[[\"class\"],[\"message\"]],{\"statements\":[[0,\"            \"],[7,\"label\"],[11,\"class\",\"control-label\"],[9],[0,\"Reason\"],[10],[0,\"\\n            \"],[7,\"input\"],[12,\"value\",[23,\"message\"]],[11,\"class\",\"form-control\"],[12,\"oninput\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"message\"]]],null]],[[\"value\"],[\"target.value\"]]]],[11,\"placeholder\",\"Reason for the job state change (optional)\"],[11,\"type\",\"text\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"group\"]],\"expected `form.group` to be a contextual component but found a string. Did you mean `(component form.group)`? ('screwdriver-ui/components/job-toggle-modal/template.hbs' @ L16:C13) \"],null]],[[\"class\"],[\"footer\"]],{\"statements\":[[0,\"            \"],[4,\"bs-button\",null,[[\"buttonType\",\"class\",\"type\"],[\"submit\",\"toggle-form__create\",\"primary\"]],{\"statements\":[[0,\"Confirm\"]],\"parameters\":[]},null],[0,\"\\n            \"],[4,\"bs-button\",null,[[\"class\",\"onClick\",\"type\"],[\"toggle-form__cancel\",[29,\"action\",[[24,0,[]],[24,1,[\"close\"]]],null],\"default\"]],{\"statements\":[[0,\"Cancel\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/job-toggle-modal/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/light-table", ["exports", "ember-light-table/components/light-table"], function (_exports, _lightTable) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _lightTable.default;
    }
  });
});
;define("screwdriver-ui/components/light-table/cells/base", ["exports", "ember-light-table/components/cells/base"], function (_exports, _base) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _base.default;
    }
  });
});
;define("screwdriver-ui/components/light-table/columns/base", ["exports", "ember-light-table/components/columns/base"], function (_exports, _base) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _base.default;
    }
  });
});
;define("screwdriver-ui/components/loading-view/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    /**
     * Quotes from: https://www.npmjs.com/package/funnies which has an MIT License
     * @property {Array} funnies
     */
    funnies: ['Reticulating splines...', 'Generating witty dialog...', 'Swapping time and space...', 'Spinning violently around the y-axis...', 'Tokenizing real life...', 'Bending the spoon...', 'Filtering morale...', "Don't think of purple hippos...", 'We need a new fuse...', 'Have a good day.', '640K ought to be enough for anybody', 'The architects are still drafting', 'The bits are breeding', "We're building the buildings as fast as we can", 'Would you prefer chicken, steak, or tofu?', '(Pay no attention to the man behind the curtain)', '...and enjoy the elevator music...', 'Please wait while the little elves draw your map', "Don't worry - a few bits tried to escape, but we caught them", 'Would you like fries with that?', 'Checking the gravitational constant in your locale...', 'Go ahead -- hold your breath!', "...at least you're not on hold...", 'Hum something loud while others stare', "You're not in Kansas any more", 'The server is powered by a lemon and two electrodes.', 'Please wait while a larger software vendor in Seattle takes over the world', "We're testing your patience", 'As if you had any other choice', 'Follow the white rabbit', "Why don't you order a sandwich?", 'While the satellite moves into position', 'The bits are flowing slowly today', "Dig on the 'X' for buried treasure... ARRR!", "It's still faster than you could draw it", "The last time I tried this the monkey didn't survive. Let's hope it works better this time.", 'I should have had a V8 this morning.', 'My other loading screen is much faster.', "Testing on Timmy... We're going to need another Timmy.", 'Reconfoobling energymotron...', '(Insert quarter)', 'Are we there yet?', 'Have you lost weight?', 'Just count to 10', 'Why so serious?', "It's not you. It's me.", 'Counting backwards from Infinity', "Don't panic...", 'Embiggening Prototypes', 'Do you come here often?', "Warning: Don't set yourself on fire.", "We're making you a cookie.", 'Creating time-loop inversion field', 'Spinning the wheel of fortune...', 'Loading the enchanted bunny...', 'Computing chance of success', "I'm sorry Dave, I can't do that.", 'Looking for exact change', 'All your web browser are belong to us', 'Eating brownie points...', 'Finding cat pictures...', 'Calculating route through hyperspace...', 'Solving for "X"...', 'Recounting votes...'],

    /**
     * Get a random quote
     * @property {String} loadingMessage
     */
    loadingMessage: Ember.computed({
      get() {
        const index = Math.floor(Math.random() * this.funnies.length);
        return this.funnies[index];
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/loading-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "/IaLDDH+",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"loading\"],[9],[0,\"\\n  \"],[7,\"h2\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-spinner fa-spin fa-fw\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Loading...\"],[10],[0,\"\\n  \"],[7,\"p\"],[9],[1,[23,\"loadingMessage\"],false],[10],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/loading-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/login-button/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    actions: {
      authenticate(scmContext) {
        this.authenticate(scmContext);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/login-button/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "I+9KBiKG",
    "block": "{\"symbols\":[\"scmContext\",\"&default\"],\"statements\":[[7,\"h2\"],[9],[0,\"Sign in to Screwdriver\"],[10],[0,\"\\n\"],[7,\"p\"],[9],[0,\"\\n  Screwdriver uses your source code management solution to handle user authentication.\\n  Giving Screwdriver access to your repos will allow us to automatically add webhooks,\\n  and provide the same permissions model to pipelines as you have already set up on the repository.\\n\"],[10],[0,\"\\n\"],[7,\"p\"],[9],[0,\"\\n  Clicking this button will open a new window with your SCM provider.\\n\"],[10],[0,\"\\n\\n\"],[4,\"each\",[[25,[\"scmContexts\"]]],null,{\"statements\":[[0,\"  \"],[7,\"p\"],[9],[0,\"\\n    \"],[7,\"a\"],[11,\"href\",\"#authenticate\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-sign-in\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Sign in with \"],[1,[24,1,[\"displayName\"]],false],[3,\"action\",[[24,0,[]],\"authenticate\",[24,1,[\"context\"]]]],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[1]},{\"statements\":[[0,\"  \"],[7,\"a\"],[11,\"href\",\"#authenticate\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-sign-in\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Sign in with SCM Provider\"],[3,\"action\",[[24,0,[]],\"authenticate\"]],[10],[0,\"\\n\"]],\"parameters\":[]}],[15,2],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/login-button/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/lt-body", ["exports", "ember-light-table/components/lt-body"], function (_exports, _ltBody) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltBody.default;
    }
  });
});
;define("screwdriver-ui/components/lt-column-resizer", ["exports", "ember-light-table/components/lt-column-resizer"], function (_exports, _ltColumnResizer) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltColumnResizer.default;
    }
  });
});
;define("screwdriver-ui/components/lt-foot", ["exports", "ember-light-table/components/lt-foot"], function (_exports, _ltFoot) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltFoot.default;
    }
  });
});
;define("screwdriver-ui/components/lt-head", ["exports", "ember-light-table/components/lt-head"], function (_exports, _ltHead) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltHead.default;
    }
  });
});
;define("screwdriver-ui/components/lt-infinity", ["exports", "ember-light-table/components/lt-infinity"], function (_exports, _ltInfinity) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltInfinity.default;
    }
  });
});
;define("screwdriver-ui/components/lt-row", ["exports", "ember-light-table/components/lt-row"], function (_exports, _ltRow) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltRow.default;
    }
  });
});
;define("screwdriver-ui/components/lt-scrollable", ["exports", "ember-light-table/components/lt-scrollable"], function (_exports, _ltScrollable) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltScrollable.default;
    }
  });
});
;define("screwdriver-ui/components/lt-spanned-row", ["exports", "ember-light-table/components/lt-spanned-row"], function (_exports, _ltSpannedRow) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ltSpannedRow.default;
    }
  });
});
;define("screwdriver-ui/components/modal-dialog", ["exports", "ember-modal-dialog/components/modal-dialog"], function (_exports, _modalDialog) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _modalDialog.default;
    }
  });
});
;define("screwdriver-ui/components/nav-banner/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    banner: Ember.inject.service('banner'),
    actions: {
      clearMessage() {
        this.set('message', null);
      }

    },

    setBanners() {
      this.banner.fetchBanners().then(banners => {
        if (!this.isDestroying && !this.isDestroyed) {
          Ember.set(this, 'banners', banners);
        }
      });
    },

    // Start loading active banners immediately upon inserting the element
    didInsertElement() {
      this._super(...arguments);

      this.setBanners();
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/nav-banner/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "f3ose/WB",
    "block": "{\"symbols\":[\"banner\"],\"statements\":[[4,\"each\",[[25,[\"banners\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"banner\"],[9],[0,\"\\n\"],[4,\"bs-alert\",null,[[\"type\"],[[24,1,[\"type\"]]]],{\"statements\":[[0,\"      \"],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[29,\"if\",[[29,\"eq\",[[24,1,[\"type\"]],\"info\"],null],\"info-circle\",\"exclamation-triangle\"],null]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n      \"],[7,\"span\"],[9],[1,[24,1,[\"message\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/nav-banner/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-create-form/component", ["exports", "jquery", "screwdriver-ui/utils/git"], function (_exports, _jquery, _git) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    scmUrl: '',
    rootDir: '',
    isInvalid: Ember.computed.not('isValid'),
    isDisabled: Ember.computed.or('isSaving', 'isInvalid'),
    isValid: Ember.computed('scmUrl', {
      get() {
        const val = this.scmUrl;
        return val.length !== 0 && (0, _git.parse)(val).valid;
      }

    }),
    actions: {
      /**
       * Handles when a git url is entered in step 1
       * @method scmChange
       * @param  {String} val     The value of the input box
       */
      scmChange(val) {
        this.set('scmUrl', val.trim());
        const input = (0, _jquery.default)('.scm-url');
        input.removeClass('bad-text-input good-text-input');

        if (this.isValid) {
          input.addClass('good-text-input');
        } else if (val.trim().length > 0) {
          input.addClass('bad-text-input');
        }
      },

      /**
       * Update rootdir
       * @method updateRootDir
       * @param  {String}      val The value of the rootDir input box
       */
      updateRootDir(val) {
        this.set('rootDir', val.trim());
      },

      /**
       * Call Api to save project
       * @event saveData
       * @param  {Object} data Project attributes
       */
      saveData() {
        if (this.isValid) {
          this.onCreatePipeline({
            scmUrl: this.scmUrl,
            rootDir: this.rootDir
          });
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-create-form/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "6RUTH2QH",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[7,\"h1\"],[9],[0,\"Create Pipeline\"],[10],[0,\"\\n\"],[7,\"p\"],[9],[0,\"Add a Git repository to Screwdriver by pasting your repository link below.\"],[7,\"br\"],[9],[10],[0,\"We accept both HTTPS and SSH URLs.\"],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"\\n  \"],[1,[29,\"input\",null,[[\"class\",\"key-up\",\"placeholder\",\"value\",\"enter\"],[\"text-input scm-url\",[29,\"action\",[[24,0,[]],\"scmChange\"],null],\"Enter your repository url (eg: git@github.com:screwdriver-cd/ui.git#master)\",[25,[\"scmUrl\"]],[29,\"action\",[[24,0,[]],\"saveData\"],null]]]],false],[0,\"\\n\"],[4,\"if\",[[25,[\"isValid\"]]],null,{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"success\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-check\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"\\n  \"],[1,[29,\"pipeline-rootdir\",null,[[\"hasRootDir\",\"updateRootDir\"],[false,[29,\"action\",[[24,0,[]],\"updateRootDir\"],null]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[9],[0,\"\\n  \"],[7,\"button\"],[12,\"disabled\",[23,\"isDisabled\"]],[12,\"class\",[30,[\"blue-button\",[29,\"if\",[[25,[\"isSaving\"]],\" saving\"],null]]]],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"saving-loading\"],[9],[0,\"\\n      Creating Pipeline\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"button-label\"],[9],[0,\"Create Pipeline\"],[10],[0,\"\\n  \"],[3,\"action\",[[24,0,[]],\"saveData\"]],[10],[0,\"\\n  \"],[4,\"if\",[[25,[\"isSaving\"]]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-spinner fa-spin\"],[11,\"aria-hidden\",\"true\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-create-form/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-event-row/component", ["exports", "screwdriver-ui/utils/build"], function (_exports, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNameBindings: ['highlighted', 'event.status'],
    highlighted: Ember.computed('selectedEvent', 'event.id', {
      get() {
        return Ember.get(this, 'selectedEvent') === Ember.get(this, 'event.id');
      }

    }),
    icon: Ember.computed('event.status', {
      get() {
        return (0, _build.statusIcon)(this.get('event.status'), true);
      }

    }),
    actions: {
      clickRow() {
        const fn = Ember.get(this, 'eventClick');

        if (typeof fn === 'function') {
          fn(Ember.get(this, 'event.id'));
        }
      }

    },

    click() {
      this.send('clickRow');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-event-row/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "P28Auy4p",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"view\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"status\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[23,\"icon\"],\" fa-fw\"]]],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"detail\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"commit\"],[12,\"title\",[25,[\"event\",\"causeMessage\"]]],[9],[0,\"\\n\"],[4,\"if\",[[29,\"eq\",[[25,[\"event\",\"type\"]],\"pr\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"a\"],[12,\"href\",[25,[\"event\",\"pr\",\"url\"]]],[9],[0,\"PR-\"],[1,[25,[\"event\",\"prNum\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"a\"],[12,\"class\",[29,\"if\",[[29,\"eq\",[[25,[\"event\",\"id\"]],[25,[\"lastSuccessful\"]]],null],\"last-successful\"],null]],[12,\"href\",[25,[\"event\",\"commit\",\"url\"]]],[9],[0,\"#\"],[1,[25,[\"event\",\"truncatedSha\"]],false],[10],[0,\"\\n        \"],[4,\"if\",[[25,[\"event\",\"label\"]]],null,{\"statements\":[[7,\"div\"],[11,\"class\",\"label\"],[9],[1,[25,[\"event\",\"label\"]],false],[10]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"date greyOut\"],[9],[0,\"Started \"],[1,[25,[\"event\",\"createTimeWords\"]],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"message\"],[12,\"title\",[25,[\"event\",\"commit\",\"message\"]]],[9],[1,[25,[\"event\",\"truncatedMessage\"]],false],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"by\"],[9],[7,\"a\"],[12,\"href\",[25,[\"event\",\"creator\",\"url\"]]],[9],[1,[25,[\"event\",\"creator\",\"name\"]],false],[10],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"workflow\"],[9],[0,\"\\n\"],[4,\"if\",[[29,\"and\",[[29,\"is-fulfilled\",[[25,[\"event\",\"builds\"]]],null],[25,[\"event\",\"workflowGraph\"]]],null]],null,{\"statements\":[[0,\"        \"],[1,[29,\"workflow-graph-d3\",null,[[\"builds\",\"workflowGraph\",\"startFrom\",\"causeMessage\",\"minified\"],[[25,[\"event\",\"builds\"]],[25,[\"event\",\"workflowGraph\"]],[25,[\"event\",\"startFrom\"]],[25,[\"event\",\"causeMessage\"]],true]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-event-row/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-events-list/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    errorMessage: '',
    eventsList: Ember.computed('events.[]', {
      get() {
        return Ember.get(this, 'events');
      }

    }),

    init() {
      this._super(...arguments);

      Ember.run.scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
    },

    actions: {
      eventClick(id) {
        Ember.set(this, 'selected', id);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-events-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "S4d9KD0f",
    "block": "{\"symbols\":[\"event\",\"&default\"],\"statements\":[[7,\"div\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"eventsList\"]]],null,{\"statements\":[[0,\"    \"],[1,[29,\"pipeline-event-row\",null,[[\"event\",\"selectedEvent\",\"lastSuccessful\",\"eventClick\"],[[24,1,[]],[25,[\"selectedEvent\"]],[25,[\"lastSuccessful\"]],[29,\"action\",[[24,0,[]],\"eventClick\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[1]},{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"alert\"],[9],[0,\"No events have been run for this pipeline\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[10],[0,\"\\n\\n\"],[15,2]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-events-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-graph-nav/component", ["exports", "screwdriver-ui/utils/build"], function (_exports, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    session: Ember.inject.service(),
    isPR: Ember.computed('graphType', {
      get() {
        return this.graphType === 'pr';
      }

    }),
    prJobs: Ember.computed('selectedEventObj.prNum', 'prGroups', {
      get() {
        const prNum = this.get('selectedEventObj.prNum');
        return this.prGroups[prNum];
      }

    }),
    eventOptions: Ember.computed('lastSuccessful', 'mostRecent', 'isPR', {
      get() {
        const options = [{
          label: 'Most Recent',
          value: this.mostRecent
        }, {
          label: 'Last Successful',
          value: this.lastSuccessful
        }];

        if (!this.isPR) {
          options.push({
            label: 'Aggregate',
            value: 'aggregate'
          });
        }

        return options;
      }

    }),
    icon: Ember.computed('selectedEventObj.status', {
      get() {
        return (0, _build.statusIcon)(this.get('selectedEventObj.status'));
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-graph-nav/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "AVpTgmk9",
    "block": "{\"symbols\":[\"bg\",\"opt\"],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-4\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"isPR\"]]],null,{\"statements\":[[0,\"      \"],[7,\"strong\"],[9],[0,\"Pull Requests\"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"      \"],[7,\"strong\"],[9],[0,\"Pipeline\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[4,\"bs-button-group\",null,[[\"value\",\"type\",\"onChange\"],[[25,[\"selectedEvent\"]],\"radio\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"selected\"]]],null]],null]]],{\"statements\":[[4,\"each\",[[25,[\"eventOptions\"]]],null,{\"statements\":[[0,\"        \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"button\"]],\"expected `bg.button` to be a contextual component but found a string. Did you mean `(component bg.button)`? ('screwdriver-ui/components/pipeline-graph-nav/template.hbs' @ L14:C11) \"],null]],[[\"value\"],[[24,2,[\"value\"]]]],{\"statements\":[[1,[24,2,[\"label\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-3\"],[12,\"title\",[30,[\"Toggle to \",[29,\"if\",[[25,[\"showDownstreamTriggers\"]],\"hide\",\"show\"],null],\" the downstream trigger nodes.\"]]],[9],[0,\"\\n    \"],[1,[29,\"x-toggle\",null,[[\"size\",\"theme\",\"showLabels\",\"value\",\"offLabel\",\"onLabel\",\"onToggle\"],[\"medium\",\"material\",true,[25,[\"showDownstreamTriggers\"]],\"Hide triggers\",\"Show triggers\",[29,\"action\",[[24,0,[]],[25,[\"setDownstreamTrigger\"]]],null]]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-5\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"selectedEventObj\",\"type\"]],\"pr\"],null]],null,{\"statements\":[[0,\"        \"],[1,[29,\"pipeline-start\",null,[[\"startBuild\",\"prNum\",\"jobs\"],[[29,\"action\",[[24,0,[]],[25,[\"startPRBuild\"]]],null],[25,[\"selectedEventObj\",\"prNum\"]],[25,[\"prJobs\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[1,[29,\"pipeline-start\",null,[[\"startBuild\"],[[29,\"action\",[[24,0,[]],[25,[\"startMainBuild\"]]],null]]]],false],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"selectedEventObj\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[12,\"class\",[30,[\"row \",[25,[\"selectedEventObj\",\"status\"]]]]],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-xs-12\"],[9],[0,\"\\n\"],[4,\"unless\",[[29,\"eq\",[[25,[\"selected\"]],\"aggregate\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"event-info\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Commit\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[7,\"a\"],[12,\"href\",[25,[\"selectedEventObj\",\"commit\",\"url\"]]],[9],[0,\"#\"],[1,[25,[\"selectedEventObj\",\"truncatedSha\"]],false],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Message\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[7,\"span\"],[12,\"title\",[25,[\"selectedEventObj\",\"commit\",\"message\"]]],[9],[1,[25,[\"selectedEventObj\",\"truncatedMessage\"]],false],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Status\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"status\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[23,\"icon\"],\" fa-fw\"]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[25,[\"selectedEventObj\",\"status\"]],false],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"User\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[7,\"a\"],[12,\"href\",[25,[\"selectedEventObj\",\"creator\",\"url\"]]],[9],[1,[25,[\"selectedEventObj\",\"creator\",\"name\"]],false],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Start Time\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[1,[25,[\"selectedEventObj\",\"createTimeWords\"]],false],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n            \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Duration\"],[10],[7,\"br\"],[9],[10],[0,\"\\n            \"],[1,[25,[\"selectedEventObj\",\"durationText\"]],false],[0,\"\\n          \"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"selectedEventObj\",\"label\"]]],null,{\"statements\":[[0,\"            \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n              \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Label\"],[10],[7,\"br\"],[9],[10],[0,\"\\n              \"],[1,[25,[\"selectedEventObj\",\"label\"]],false],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"selectedEventObj\",\"isRunning\"]]],null,{\"statements\":[[0,\"            \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n              \"],[4,\"bs-button\",null,[[\"onClick\",\"class\",\"title\"],[[29,\"action\",[[24,0,[]],[25,[\"stopEvent\"]]],null],\"event__stop\",\"Stop all builds for this event\"]],{\"statements\":[[0,\"Stop\"]],\"parameters\":[]},null],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-graph-nav/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-header/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    showCollectionModal: false,
    scmService: Ember.inject.service('scm'),
    classNames: ['row'],
    classNameBindings: ['isBuildPage'],
    router: Ember.inject.service(),
    addCollectionError: null,
    addCollectionSuccess: null,
    dropdownText: 'Add to collection',
    isBuildPage: Ember.computed('router.currentRouteName', {
      get() {
        return Ember.get(this, 'router.currentRouteName') === 'pipeline.build';
      }

    }),
    scmContext: Ember.computed({
      get() {
        const scm = this.scmService.getScm(this.pipeline.get('scmContext'));
        return {
          scm: scm.displayName,
          scmIcon: scm.iconType
        };
      }

    }),
    actions: {
      openModal() {
        this.set('showCollectionModal', true);
      },

      addToCollection(pipelineId, collection) {
        return this.addToCollection(+pipelineId, collection.id).then(() => {
          this.set('addCollectionError', null);
          this.set('addCollectionSuccess', "Successfully added Pipeline to ".concat(collection.get('name')));
        }).catch(() => {
          this.set('addCollectionError', "Could not add Pipeline to ".concat(collection.get('name')));
          this.set('addCollectionSuccess', null);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-header/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "h7i3uY9q",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"addCollectionError\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"addCollectionError\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"addCollectionSuccess\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"addCollectionSuccess\"]],\"success\",\"check\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"link-to\",[\"pipeline\",[25,[\"pipeline\",\"id\"]]],null,{\"statements\":[[7,\"h1\"],[9],[1,[25,[\"pipeline\",\"appId\"]],false],[10]],\"parameters\":[]},null],[0,\"\\n\"],[7,\"a\"],[12,\"href\",[25,[\"pipeline\",\"hubUrl\"]]],[11,\"class\",\"branch\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[25,[\"pipeline\",\"branch\"]],false],[10],[0,\"\\n\"],[7,\"span\"],[11,\"class\",\"scm\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[25,[\"scmContext\",\"scmIcon\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[25,[\"scmContext\",\"scm\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"  \"],[7,\"i\"],[11,\"class\",\"fa fa-cog\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[4,\"link-to\",[\"pipeline\",[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"Parent Pipeline\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[1,[29,\"collection-dropdown\",null,[[\"pipeline\",\"pipelineId\",\"collections\",\"addToCollection\",\"addCollectionSuccess\",\"addCollectionError\",\"dropdownText\"],[[25,[\"pipeline\"]],[25,[\"pipeline\",\"id\"]],[25,[\"collections\"]],[25,[\"addToCollection\"]],[25,[\"addCollectionSuccess\"]],[25,[\"addCollectionError\"]],[25,[\"dropdownText\"]]]]],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-header/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-list/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    // start all child pipelines
    start: Ember.inject.service('pipeline-startall'),
    errorMessage: '',
    isShowingModal: false,
    actions: {
      startAll() {
        this.set('isShowingModal', true);
        return this.start.startAll(this.pipeline.id).catch(error => this.set('errorMessage', error)).finally(() => this.set('isShowingModal', false));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "Theq31bP",
    "block": "{\"symbols\":[\"pipeline\"],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"pipelines\",\"length\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"num-results col-xs-12 col-md-8\"],[9],[0,\"\\n    \"],[7,\"span\"],[9],[0,\"Found \"],[1,[25,[\"pipelines\",\"length\"]],false],[0,\" child pipeline(s)\"],[10],[0,\"\\n    \"],[7,\"button\"],[11,\"class\",\"start-button\"],[9],[0,\"Start All\"],[3,\"action\",[[24,0,[]],\"startAll\"]],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"ul\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"pipelines\"]]],null,{\"statements\":[[0,\"      \"],[7,\"li\"],[11,\"class\",\"appId\"],[9],[4,\"link-to\",[\"pipeline\",[24,1,[\"id\"]]],null,{\"statements\":[[1,[24,1,[\"appId\"]],false]],\"parameters\":[]},null],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"num-results\"],[9],[0,\"\\n    \"],[7,\"span\"],[9],[0,\"No child pipeline(s) created\"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[false,\"center\",true]],{\"statements\":[[0,\"    \"],[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-nav/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNames: ['row']
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-nav/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "8Iat63WR",
    "block": "{\"symbols\":[\"nav\"],\"statements\":[[4,\"bs-nav\",null,[[\"type\"],[\"pills\"]],{\"statements\":[[4,\"if\",[[25,[\"pipeline\",\"childPipelines\"]]],null,{\"statements\":[[0,\"    \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L3:C7) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L3:C20) \"],null],\"pipeline.child-pipelines\"],null,{\"statements\":[[0,\"Child Pipelines\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L5:C5) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L5:C18) \"],null],\"pipeline.events\"],null,{\"statements\":[[0,\"Events\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L6:C5) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L6:C18) \"],null],\"pipeline.secrets\"],null,{\"statements\":[[0,\"Secrets\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L7:C5) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L7:C18) \"],null],\"pipeline.options\"],null,{\"statements\":[[0,\"Options\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n  \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L8:C5) \"],null]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/components/pipeline-nav/template.hbs' @ L8:C18) \"],null],\"pipeline.metrics\"],[[\"class\"],[\"beta-feature\"]],{\"statements\":[[0,\"Metrics\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-nav/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-options/component", ["exports", "jquery", "screwdriver-ui/utils/git"], function (_exports, _jquery, _git) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /* eslint ember/avoid-leaking-state-in-components: [2, ["jobSorting"]] */
  var _default = Ember.Component.extend({
    // Syncing a pipeline
    sync: Ember.inject.service('sync'),
    // Clearing a cache
    cache: Ember.inject.service('cache'),
    errorMessage: '',
    scmUrl: '',
    rootDir: '',
    // Removing a pipeline
    isRemoving: false,
    isShowingModal: false,
    showDangerButton: true,
    showRemoveButtons: false,
    showToggleModal: false,
    // Job disable/enable
    name: null,
    state: null,
    stateChange: null,
    user: null,
    jobId: null,
    jobSorting: ['name'],
    sortedJobs: Ember.computed.sort('jobs', 'jobSorting'),
    isInvalid: Ember.computed.not('isValid'),
    isDisabled: Ember.computed.or('isSaving', 'isInvalid'),
    isValid: Ember.computed('scmUrl', {
      get() {
        const val = this.scmUrl;
        return val.length !== 0 && (0, _git.parse)(val).valid;
      }

    }),

    // Updating a pipeline
    init() {
      this._super(...arguments);

      this.set('scmUrl', (0, _git.getCheckoutUrl)({
        appId: this.get('pipeline.appId'),
        scmUri: this.get('pipeline.scmUri')
      }));

      if (this.get('pipeline.scmRepo.rootDir')) {
        this.set('rootDir', this.get('pipeline.scmRepo.rootDir'));
      }
    },

    actions: {
      // Checks if scm URL is valid or not
      scmChange(val) {
        this.set('scmUrl', val.trim());
        const input = (0, _jquery.default)('.text-input');
        input.removeClass('bad-text-input good-text-input');

        if (this.isValid) {
          input.addClass('good-text-input');
        } else if (val.trim().length > 0) {
          input.addClass('bad-text-input');
        }
      },

      updateRootDir(val) {
        this.set('rootDir', val.trim());
      },

      updatePipeline() {
        this.onUpdatePipeline({
          scmUrl: this.scmUrl,
          rootDir: this.rootDir
        });
      },

      toggleJob(jobId, user, name, stillActive) {
        const status = stillActive ? 'ENABLED' : 'DISABLED';
        this.set('name', name);
        this.set('stateChange', status[0].toUpperCase() + status.slice(1, -1).toLowerCase());
        this.set('state', status);
        this.set('user', user);
        this.set('jobId', jobId);
        this.set('showToggleModal', true);
      },

      updateMessage(message) {
        const {
          state,
          user,
          jobId
        } = this;
        this.setJobStatus(jobId, state, user, message || ' ');
        this.set('showToggleModal', false);
      },

      showRemoveButtons() {
        this.set('showDangerButton', false);
        this.set('showRemoveButtons', true);
      },

      cancelRemove() {
        this.set('showDangerButton', true);
        this.set('showRemoveButtons', false);
      },

      removePipeline() {
        this.set('showRemoveButtons', false);
        this.set('isRemoving', true);
        this.onRemovePipeline();
      },

      sync(syncPath) {
        this.set('isShowingModal', true);
        return this.sync.syncRequests(this.get('pipeline.id'), syncPath).catch(error => this.set('errorMessage', error)).finally(() => this.set('isShowingModal', false));
      },

      clearCache(scope, id) {
        let config = {
          scope,
          id
        };
        this.set('isShowingModal', true);

        if (scope === 'pipelines') {
          config.id = this.get('pipeline.id');
        }

        return this.cache.clearCache(config).catch(error => this.set('errorMessage', error)).finally(() => this.set('isShowingModal', false));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-options/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "GHzieFx+",
    "block": "{\"symbols\":[\"job\",\"job\",\"&default\"],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\"],[4,\"unless\",[[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n      \"],[7,\"section\"],[11,\"class\",\"pipeline\"],[9],[0,\"\\n        \"],[7,\"h3\"],[9],[0,\"Pipeline\"],[10],[0,\"\\n        \"],[7,\"ul\"],[9],[0,\"\\n          \"],[7,\"li\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n                \"],[7,\"h4\"],[9],[0,\"Checkout URL and Source Directory\"],[10],[0,\"\\n                \"],[7,\"p\"],[9],[0,\"Update your checkout URL and / or source directory.\"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n                \"],[7,\"div\"],[9],[0,\"\\n                  \"],[1,[29,\"input\",null,[[\"class\",\"key-up\",\"value\"],[\"text-input scm-url\",[29,\"action\",[[24,0,[]],\"scmChange\"],null],[25,[\"scmUrl\"]]]]],false],[0,\"\\n                \"],[10],[0,\"\\n                \"],[1,[29,\"pipeline-rootdir\",null,[[\"hasRootDir\",\"rootDir\",\"updateRootDir\"],[[29,\"if\",[[24,0,[\"rootDir\"]],true,false],null],[24,0,[\"rootDir\"]],[29,\"action\",[[24,0,[]],\"updateRootDir\"],null]]]],false],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"col-xs-12 right\"],[9],[0,\"\\n                \"],[7,\"button\"],[12,\"disabled\",[23,\"isDisabled\"]],[12,\"class\",[30,[\"blue-button\",[29,\"if\",[[25,[\"isSaving\"]],\" saving\"],null]]]],[9],[0,\"\\n                  \"],[7,\"div\"],[11,\"class\",\"saving-loading\"],[9],[0,\"\\n                    Updating pipeline\\n                  \"],[10],[0,\"\\n                  \"],[7,\"div\"],[11,\"class\",\"button-label\"],[9],[0,\"Update\"],[10],[0,\"\\n                \"],[3,\"action\",[[24,0,[]],\"updatePipeline\"]],[10],[0,\"\\n                \"],[4,\"if\",[[25,[\"isSaving\"]]],null,{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-spinner fa-spin\"],[11,\"aria-hidden\",\"true\"],[9],[10]],\"parameters\":[]},null],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n    \"],[7,\"section\"],[11,\"class\",\"jobs\"],[9],[0,\"\\n      \"],[7,\"h3\"],[9],[0,\"Jobs\"],[10],[0,\"\\n      \"],[7,\"ul\"],[9],[0,\"\\n        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n              \"],[7,\"p\"],[9],[0,\"Toggle to disable or enable the job.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"sortedJobs\"]]],null,{\"statements\":[[0,\"            \"],[7,\"li\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n                  \"],[7,\"h4\"],[9],[1,[24,2,[\"name\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[24,2,[\"stateChanger\"]]],null,{\"statements\":[[0,\"                    \"],[7,\"i\"],[11,\"class\",\"float-right\"],[9],[7,\"small\"],[9],[1,[24,2,[\"stateChangeTimeWords\"]],false],[10],[10],[0,\"\\n                    \"],[7,\"p\"],[9],[1,[29,\"if\",[[24,2,[\"isDisabled\"]],\"Disabled\",\"Enabled\"],null],false],[0,\" by \"],[1,[24,2,[\"stateChanger\"]],false],[4,\"if\",[[24,2,[\"stateChangeMessage\"]]],null,{\"statements\":[[0,\": \"],[1,[24,2,[\"stateChangeMessage\"]],false]],\"parameters\":[]},null],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"                \"],[10],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[12,\"title\",[30,[\"Toggle to \",[29,\"if\",[[24,2,[\"isDisabled\"]],\"enable\",\"disable\"],null],\" the \",[24,2,[\"name\"]],\" job.\"]]],[9],[0,\"\\n                  \"],[1,[29,\"x-toggle\",null,[[\"size\",\"value\",\"onLabel\",\"offLabel\",\"onToggle\"],[\"small\",[29,\"not\",[[24,2,[\"isDisabled\"]]],null],\"Enabled::false\",\"Disabled::true\",[29,\"action\",[[24,0,[]],\"toggleJob\",[24,2,[\"id\"]],[25,[\"username\"]],[24,2,[\"name\"]]],null]]]],false],[0,\"\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n    \"],[7,\"section\"],[11,\"class\",\"sync\"],[9],[0,\"\\n      \"],[7,\"h3\"],[9],[0,\"Sync\"],[10],[0,\"\\n      \"],[7,\"ul\"],[9],[0,\"\\n        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n              \"],[7,\"h4\"],[9],[0,\"SCM webhooks\"],[10],[0,\"\\n              \"],[7,\"p\"],[9],[0,\"Update the webhooks if they are not working correctly.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[9],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"sync\",\"webhooks\"]],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n              \"],[7,\"h4\"],[9],[0,\"Pull requests\"],[10],[0,\"\\n              \"],[7,\"p\"],[9],[0,\"Create or update pull-request jobs if they are not displaying properly.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[9],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"sync\",\"pullrequests\"]],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n              \"],[7,\"h4\"],[9],[0,\"Pipeline\"],[10],[0,\"\\n              \"],[7,\"p\"],[9],[0,\"Update jobs if they are not displaying properly.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[9],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"sync\"]],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n    \"],[7,\"section\"],[11,\"class\",\"cache\"],[9],[0,\"\\n      \"],[7,\"h3\"],[9],[0,\"Cache\"],[10],[0,\"\\n      \"],[7,\"ul\"],[9],[0,\"\\n        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n              \"],[7,\"h4\"],[9],[0,\"Pipeline\"],[10],[0,\"\\n              \"],[7,\"p\"],[9],[0,\"Click to clear the cache for the pipeline.\"],[10],[0,\"\\n            \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[9],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"clearCache\",\"pipelines\"]],[10],[0,\"\\n            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"sortedJobs\"]]],null,{\"statements\":[[4,\"unless\",[[24,1,[\"isPR\"]]],null,{\"statements\":[[0,\"            \"],[7,\"li\"],[9],[0,\"\\n              \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-10\"],[9],[0,\"\\n                  \"],[7,\"h4\"],[9],[0,\"Job \"],[1,[24,1,[\"name\"]],false],[10],[0,\"\\n                  \"],[7,\"p\"],[9],[0,\"Click to clear the cache for the \"],[1,[24,1,[\"name\"]],false],[0,\" job.\"],[10],[0,\"\\n                \"],[10],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-2 right\"],[12,\"title\",[30,[\"Click to clear cache for \",[24,1,[\"name\"]],\" job.\"]]],[9],[0,\"\\n                  \"],[7,\"a\"],[11,\"href\",\"#\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"clearCache\",\"jobs\",[24,1,[\"id\"]]]],[10],[0,\"\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n            \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n\"],[4,\"unless\",[[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-8\"],[9],[0,\"\\n      \"],[7,\"section\"],[11,\"class\",\"danger\"],[9],[0,\"\\n        \"],[7,\"h3\"],[9],[0,\"Danger Zone\"],[10],[0,\"\\n        \"],[7,\"ul\"],[9],[0,\"\\n          \"],[7,\"li\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"showDangerButton\"]]],null,{\"statements\":[[0,\"              \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-1 col-md-8\"],[9],[0,\"\\n                  \"],[7,\"h4\"],[9],[0,\"Remove this pipeline\"],[10],[0,\"\\n                  \"],[7,\"p\"],[9],[0,\"Once you remove a pipeline, there is no going back.\"],[10],[0,\"\\n                \"],[10],[0,\"\\n                \"],[7,\"div\"],[11,\"class\",\"col-xs-1 col-md-4 right\"],[9],[0,\"\\n                  \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"trash\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"showRemoveButtons\"]],[10],[0,\"\\n                \"],[10],[0,\"\\n              \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"showRemoveButtons\"]]],null,{\"statements\":[[0,\"              \"],[7,\"h4\"],[9],[0,\"Are you absolutely sure?\"],[10],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"cancel\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-ban\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Cancel\"],[3,\"action\",[[24,0,[]],\"cancelRemove\"]],[10],[0,\"\\n              \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"remove\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Remove\"],[3,\"action\",[[24,0,[]],\"removePipeline\"]],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"isRemoving\"]]],null,{\"statements\":[[0,\"              \"],[7,\"p\"],[9],[0,\"Please wait...\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[false,\"center\",true]],{\"statements\":[[0,\"    \"],[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"job-toggle-modal\",null,[[\"showToggleModal\",\"updateMessage\",\"name\",\"stateChange\"],[[25,[\"showToggleModal\"]],[29,\"action\",[[24,0,[]],\"updateMessage\"],null],[25,[\"name\"]],[25,[\"stateChange\"]]]]],false],[0,\"\\n\"],[15,3]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-options/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-pr-list/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    didInsertElement() {
      this._super(...arguments);

      this.set('inited', false);
    },

    inited: true,
    showJobs: Ember.computed('jobs.@each.builds', 'inited', {
      get() {
        return this.inited || this.jobs.some(j => !!j.get('builds.length'));
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-pr-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "fmkHtYcW",
    "block": "{\"symbols\":[\"job\"],\"statements\":[[4,\"if\",[[25,[\"jobs\",\"length\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"view\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"detail\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"name\"],[9],[0,\"\\n        \"],[7,\"a\"],[12,\"href\",[25,[\"jobs\",\"0\",\"url\"]]],[11,\"target\",\"_blank\"],[11,\"rel\",\"noopener\"],[9],[0,\"\\n          PR #\"],[1,[25,[\"jobs\",\"0\",\"group\"]],false],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"scm\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"br\"],[9],[10],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[1,[25,[\"jobs\",\"0\",\"title\"]],false],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"date greyOut\"],[9],[0,\"Opened \"],[1,[25,[\"jobs\",\"0\",\"createTimeWords\"]],false],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"by\"],[9],[7,\"a\"],[12,\"href\",[25,[\"jobs\",\"0\",\"userProfile\"]]],[11,\"target\",\"_blank\"],[11,\"rel\",\"noopener\"],[9],[1,[25,[\"jobs\",\"0\",\"username\"]],false],[10],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"showJobs\"]]],null,{\"statements\":[[4,\"each\",[[25,[\"jobs\"]]],null,{\"statements\":[[0,\"          \"],[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[24,1,[]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"isRestricted\"]]],null,{\"statements\":[[0,\"          \"],[4,\"bs-button\",null,[[\"type\",\"class\",\"onClick\"],[\"primary\",\"startButton\",[29,\"action\",[[24,0,[]],[25,[\"startBuild\"]],[25,[\"jobs\",\"0\",\"group\"]],[25,[\"jobs\"]]],null]]],{\"statements\":[[0,\"Start\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-pr-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-pr-view/component", ["exports", "screwdriver-ui/utils/build"], function (_exports, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNameBindings: ['build.status'],
    build: Ember.computed('job.builds', {
      get() {
        return this.get('job.builds').objectAt(0);
      }

    }),
    displayName: Ember.computed('job.name', {
      get() {
        return this.get('job.name').replace('PR-', '').split(':').pop();
      }

    }),
    icon: Ember.computed('build.status', {
      get() {
        return (0, _build.statusIcon)(this.get('build.status'), true);
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-pr-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "ENNIkQC4",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"build\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"view\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"status\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[23,\"icon\"],\" fa-fw\"]]],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"detail\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"build\",\"id\"]]],null,{\"statements\":[[0,\"        \"],[4,\"link-to\",[\"pipeline.build\",[25,[\"build\",\"id\"]]],null,{\"statements\":[[1,[23,\"displayName\"],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"span\"],[11,\"class\",\"greyOut\"],[9],[1,[23,\"displayName\"],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[4,\"if\",[[25,[\"build\",\"endTimeWords\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"date greyOut\"],[9],[0,\"Finished \"],[1,[25,[\"build\",\"endTimeWords\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"build\",\"startTimeWords\"]]],null,{\"statements\":[[0,\"        \"],[7,\"div\"],[11,\"class\",\"date greyOut\"],[9],[0,\"Started \"],[1,[25,[\"build\",\"startTimeWords\"]],false],[10],[0,\"\\n      \"]],\"parameters\":[]},null]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-pr-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-rootdir/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "cBWMeWPY",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"input\",null,[[\"class\",\"type\",\"name\",\"checked\"],[\"checkbox-input\",\"checkbox\",\"hasRootDir\",[25,[\"hasRootDir\"]]]]],false],[0,\"\\n\"],[7,\"label\"],[9],[0,\"My source directory is not at the checkout root\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"hasRootDir\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[9],[0,\"\\n    \"],[1,[29,\"input\",null,[[\"class\",\"placeholder\",\"value\",\"key-up\"],[\"text-input root-dir\",\"Enter your source directory path relative to the checkout URL (eg: src)\",[25,[\"rootDir\"]],[25,[\"updateRootDir\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-rootdir/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-secret-settings/component", ["exports", "jquery"], function (_exports, _jquery) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    newName: null,
    newValue: null,
    newAllow: false,
    errorMessage: '',
    secretsSorting: ['name'],
    sortedSecrets: Ember.computed.sort('secrets', 'secretsSorting'),
    isButtonDisabled: Ember.computed('newName', 'newValue', {
      get() {
        return !this.newName || !this.newValue;
      }

    }),
    actions: {
      /**
       * Kicks off create secret flow
       * @method addNewSecret
       */
      addNewSecret() {
        if (!/^[A-Z_][A-Z0-9_]*$/.test(this.newName)) {
          this.set('errorMessage', 'Secret keys can only consist of numbers, ' + 'uppercase letters and underscores, and cannot begin with a number.');
          return false;
        }

        this.onCreateSecret(this.newName, this.newValue, this.get('pipeline.id'), this.newAllow);
        this.set('newName', null);
        this.set('newValue', null);
        this.set('newAllow', false);
        return true;
      },

      /**
       * Toggle eye-icon and password input type
       * @method togglePasswordInput
       * @param {Object} event Click event
       */
      togglePasswordInput(event) {
        const {
          target
        } = event;
        const passwordInput = target.previousSibling;
        (0, _jquery.default)(target).toggleClass('fa-eye fa-eye-slash');

        if ((0, _jquery.default)(passwordInput).attr('type') === 'password') {
          (0, _jquery.default)(passwordInput).attr('type', 'text');
        } else {
          (0, _jquery.default)(passwordInput).attr('type', 'password');
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-secret-settings/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "yd8z2xbm",
    "block": "{\"symbols\":[\"secret\",\"&default\"],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"],[7,\"h3\"],[9],[0,\"\\n  Secrets\\n  \"],[7,\"a\"],[11,\"href\",\"http://docs.screwdriver.cd/user-guide/configuration/secrets\"],[9],[0,\"\\n    \"],[7,\"i\"],[11,\"class\",\"fa fa-question-circle\"],[11,\"title\",\"More information\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"p\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"    Secrets are inherited from the \"],[4,\"link-to\",[\"pipeline.secrets\",[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"parent pipeline\"]],\"parameters\":[]},null],[0,\". You may override a secret or revert it back to its original value.\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    User secrets must also be added to the Screwdriver YAML.\\n\"]],\"parameters\":[]}],[10],[0,\"\\n\"],[7,\"table\"],[11,\"class\",\"secrets\"],[9],[0,\"\\n  \"],[7,\"thead\"],[9],[0,\"\\n    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"Key\"],[10],[0,\"\\n      \"],[7,\"th\"],[9],[0,\"Value\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"colspan\",\"2\"],[9],[0,\"Allow in PR\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"sortedSecrets\"]]],null,{\"statements\":[[0,\"      \"],[1,[29,\"secret-view\",null,[[\"secret\",\"secrets\",\"pipeline\",\"onCreateSecret\"],[[24,1,[]],[25,[\"secrets\"]],[25,[\"pipeline\"]],[25,[\"onCreateSecret\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[4,\"unless\",[[25,[\"pipeline\",\"configPipelineId\"]]],null,{\"statements\":[[0,\"    \"],[7,\"tfoot\"],[9],[0,\"\\n      \"],[7,\"tr\"],[11,\"class\",\"new\"],[9],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"key\"],[9],[1,[29,\"input\",null,[[\"placeholder\",\"size\",\"value\",\"title\"],[\"SECRET_KEY\",\"40\",[25,[\"newName\"]],\"Secret keys can only consist of numbers, uppercase letters and underscores, and cannot begin with a number.\"]]],false],[10],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"pass\"],[9],[1,[29,\"input\",null,[[\"type\",\"placeholder\",\"size\",\"value\"],[\"password\",\"SECRET_VALUE\",\"40\",[25,[\"newValue\"]]]]],false],[7,\"i\"],[11,\"class\",\"fa fa-eye toggle-icon\"],[11,\"aria-hidden\",\"true\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"togglePasswordInput\"],null]],[9],[10],[10],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"allow\"],[9],[7,\"div\"],[11,\"title\",\"Check to allow this secret to be used in pull-requests\"],[9],[1,[29,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[25,[\"newAllow\"]]]]],false],[10],[10],[0,\"\\n        \"],[7,\"td\"],[9],[7,\"button\"],[11,\"class\",\"add\"],[12,\"disabled\",[23,\"isButtonDisabled\"]],[9],[0,\"Add\"],[3,\"action\",[[24,0,[]],\"addNewSecret\"]],[10],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[10],[0,\"\\n\\n\"],[15,2],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-secret-settings/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-start/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    startArgs: Ember.computed('prNum', 'jobs', {
      get() {
        const jobs = this.jobs || [];
        const {
          prNum
        } = this;

        if (!prNum) {
          return [];
        } // Pass arguments with PR number and jobs to reload when starting PR event.


        return [prNum, jobs];
      }

    }),
    actions: {
      startBuild() {
        const args = this.startArgs;
        const startFunc = this.startBuild;
        startFunc.apply(null, args);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-start/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "dalcQRfP",
    "block": "{\"symbols\":[],\"statements\":[[7,\"button\"],[11,\"class\",\"start-button\"],[11,\"title\",\"Start a new event from latest commit\"],[9],[0,\"Start\"],[4,\"if\",[[25,[\"prNum\"]]],null,{\"statements\":[[0,\" PR-\"],[1,[23,\"prNum\"],false]],\"parameters\":[]},null],[3,\"action\",[[24,0,[]],\"startBuild\"]],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-start/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-workflow/component", ["exports", "screwdriver-ui/utils/graph-tools", "screwdriver-ui/utils/build"], function (_exports, _graphTools, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    // get all downstream triggers for a pipeline
    classNames: ['pipelineWorkflow'],
    showTooltip: false,
    graph: Ember.computed('workflowGraph', 'completeWorkflowGraph', 'showDownstreamTriggers', {
      get() {
        const {
          jobs
        } = this;
        const fetchBuilds = [];
        const graph = this.showDownstreamTriggers ? this.completeWorkflowGraph : this.workflowGraph; // Hack to make page display stuff when a workflow is not provided

        if (!graph) {
          return Ember.RSVP.reject(new Error('No workflow graph provided'));
        } // Preload the builds for the jobs


        jobs.forEach(j => {
          const jobName = Ember.get(j, 'name');
          const node = graph.nodes.find(n => n.name === jobName); // push the job id into the graph

          if (node) {
            node.id = Ember.get(j, 'id');
            fetchBuilds.push(Ember.get(j, 'builds'));
          }
        });
        return Ember.RSVP.all(fetchBuilds).then(() => {
          const builds = []; // preload the "last build" data for each job for the graph to consume

          jobs.forEach(j => builds.push(Ember.get(j, 'lastBuild'))); // set values to consume from templates

          Ember.set(this, 'builds', builds);
          Ember.set(this, 'directedGraph', graph);
          return graph;
        });
      }

    }),
    displayRestartButton: Ember.computed.alias('authenticated'),

    init() {
      this._super(...arguments);

      Ember.set(this, 'builds', []);
      Ember.set(this, 'showDownstreamTriggers', false);
    },

    didUpdateAttrs() {
      this._super(...arguments); // hide graph tooltip when event changes


      Ember.set(this, 'showTooltip', false);
    },

    actions: {
      graphClicked(job, mouseevent, sizes) {
        const EXTERNAL_TRIGGER_REGEX = /^~sd@(\d+):([\w-]+)$/;
        const edges = Ember.get(this, 'directedGraph.edges');
        let isRootNode = true;
        const isTrigger = job ? /^~/.test(job.name) : false;
        let toolTipProperties = {}; // Find root nodes to determine position of tooltip

        if (job && edges && !/^~/.test(job.name)) {
          toolTipProperties = {
            showTooltip: true,
            // detached jobs should show tooltip on the left
            showTooltipPosition: isRootNode ? 'left' : 'center',
            tooltipData: {
              displayStop: (0, _build.isActiveBuild)(job.status),
              job,
              mouseevent,
              sizes
            }
          };
          isRootNode = (0, _graphTools.isRoot)(edges, job.name);
        }

        if (!job || isTrigger) {
          const externalTriggerMatch = job ? job.name.match(EXTERNAL_TRIGGER_REGEX) : null;
          const downstreamTriggerMatch = job ? job.name.match(/^~sd-([\w-]+)-triggers$/) : null; // Add external trigger data if relevant

          if (externalTriggerMatch) {
            const externalTrigger = {
              pipelineId: externalTriggerMatch[1],
              jobName: externalTriggerMatch[2]
            };
            toolTipProperties = {
              showTooltip: true,
              showTooltipPosition: 'left',
              tooltipData: {
                mouseevent,
                sizes,
                externalTrigger
              }
            };
            Ember.setProperties(this, toolTipProperties);
            return false;
          } // Add downstream trigger data if relevant


          if (downstreamTriggerMatch) {
            const triggers = [];
            job.triggers.forEach(t => {
              const downstreamTrigger = t.match(/^~sd@(\d+):([\w-]+)$/);
              triggers.push({
                triggerName: t,
                pipelineId: downstreamTrigger[1],
                jobName: downstreamTrigger[2]
              });
            });
            toolTipProperties = {
              showTooltip: true,
              showTooltipPosition: 'left',
              tooltipData: {
                mouseevent,
                sizes,
                triggers
              }
            };
            Ember.setProperties(this, toolTipProperties);
            return false;
          } // Hide tooltip when not clicking on an active job node or root node


          this.set('showTooltip', false);
          return false;
        }

        Ember.setProperties(this, toolTipProperties);
        return false;
      },

      confirmStartBuild() {
        Ember.set(this, 'isShowingModal', true);
        Ember.set(this, 'showTooltip', false);
      },

      cancelStartBuild() {
        Ember.set(this, 'isShowingModal', false);
      },

      startDetachedBuild() {
        Ember.set(this, 'isShowingModal', false);
        this.startDetachedBuild(Ember.get(this, 'tooltipData.job'));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/pipeline-workflow/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "Q8eD/mzn",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[29,\"and\",[[29,\"eq\",[[25,[\"selected\"]],\"aggregate\"],null],[29,\"is-fulfilled\",[[25,[\"graph\"]]],null]],null]],null,{\"statements\":[[4,\"workflow-graph-d3\",null,[[\"completeWorkflowGraph\",\"workflowGraph\",\"builds\",\"jobs\",\"graphClicked\"],[[25,[\"completeWorkflowGraph\"]],[25,[\"directedGraph\"]],[25,[\"builds\"]],[25,[\"jobs\"]],[29,\"action\",[[24,0,[]],\"graphClicked\"],null]]],{\"statements\":[[0,\"    \"],[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\",\"displayRestartButton\",\"showTooltip\"],[[25,[\"tooltipData\"]],false,[25,[\"showTooltip\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"is-fulfilled\",[[25,[\"selectedEventObj\",\"builds\"]]],null]],null,{\"statements\":[[4,\"workflow-graph-d3\",null,[[\"completeWorkflowGraph\",\"showDownstreamTriggers\",\"builds\",\"jobs\",\"workflowGraph\",\"startFrom\",\"causeMessage\",\"graphClicked\"],[[25,[\"completeWorkflowGraph\"]],[25,[\"showDownstreamTriggers\"]],[25,[\"selectedEventObj\",\"builds\"]],[25,[\"jobs\"]],[25,[\"selectedEventObj\",\"workflowGraph\"]],[25,[\"selectedEventObj\",\"startFrom\"]],[25,[\"selectedEventObj\",\"causeMessage\"]],[29,\"action\",[[24,0,[]],\"graphClicked\"],null]]],{\"statements\":[[0,\"      \"],[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\",\"displayRestartButton\",\"stopBuild\",\"showTooltip\",\"showTooltipPosition\",\"confirmStartBuild\"],[[25,[\"tooltipData\"]],[25,[\"displayRestartButton\"]],[25,[\"stopBuild\"]],[25,[\"showTooltip\"]],[25,[\"showTooltipPosition\"]],[29,\"action\",[[24,0,[]],\"confirmStartBuild\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"targetAttachment\",\"translucentOverlay\",\"containerClass\"],[\"center\",true,\"detached-confirm-dialog\"]],{\"statements\":[[0,\"        \"],[7,\"h3\"],[9],[0,\"Are you sure?\"],[10],[0,\"\\n        \"],[7,\"p\"],[9],[0,\"\\n          You are about to start the job \"],[7,\"code\"],[9],[1,[25,[\"tooltipData\",\"job\",\"name\"]],false],[10],[0,\" in a new event with the same\\n          context of the selected event for sha \"],[7,\"code\"],[9],[0,\"#\"],[1,[25,[\"selectedEventObj\",\"truncatedSha\"]],false],[10],[0,\"\\n        \"],[10],[0,\"\\n        \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-6\"],[9],[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"d-button is-primary\"],[9],[0,\"Yes\"],[3,\"action\",[[24,0,[]],\"startDetachedBuild\"]],[10],[0,\"\\n          \"],[10],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"col-xs-6 right\"],[9],[0,\"\\n            \"],[7,\"button\"],[11,\"class\",\"d-button is-secondary\"],[9],[0,\"No\"],[3,\"action\",[[24,0,[]],\"cancelStartBuild\"]],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[]}]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/pipeline-workflow/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/resize-detector", ["exports", "ember-element-resize-detector/components/resize-detector"], function (_exports, _resizeDetector) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _resizeDetector.default;
    }
  });
});
;define("screwdriver-ui/components/scroll-content-element", ["exports", "ember-scrollable/components/scroll-content-element"], function (_exports, _scrollContentElement) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _scrollContentElement.default;
    }
  });
});
;define("screwdriver-ui/components/search-list/component", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    errorMessage: '',
    showModal: false,
    session: Ember.inject.service(),
    scmService: Ember.inject.service('scm'),
    addCollectionError: null,
    addCollectionSuccess: null,
    isEmpty: Ember.computed.empty('filteredPipelines'),
    showMore: Ember.computed('moreToShow', 'filteredPipelines', {
      get() {
        const pipelines = Ember.get(this, 'filteredPipelines');

        if (Array.isArray(pipelines) && pipelines.length < _environment.default.APP.NUM_PIPELINES_LISTED) {
          return false;
        }

        return Ember.get(this, 'moreToShow');
      }

    }),
    filteredPipelines: Ember.computed('pipelines', {
      get() {
        let filtered = this.pipelines; // add scm contexts into pipelines.

        return filtered.map(pipeline => {
          const scm = this.scmService.getScm(pipeline.get('scmContext'));
          pipeline.set('scm', scm.displayName);
          pipeline.set('scmIcon', scm.iconType);
          return pipeline;
        });
      }

    }),

    init() {
      this._super(...arguments);

      Ember.set(this, 'pipelinesPage', 1);
    },

    /**
     * Reset show more when component is destroyed
     * @method willDestroyElement
     */
    willDestroyElement() {
      this._super(...arguments); // Reset moreToShow value


      Ember.set(this, 'moreToShow', true);
    },

    actions: {
      moreClick() {
        const pipelinesPage = Ember.get(this, 'pipelinesPage') + 1;
        const fn = Ember.get(this, 'updatePipelines');
        Ember.set(this, 'pipelinesPage', pipelinesPage);

        if (typeof fn === 'function') {
          fn({
            page: pipelinesPage,
            search: Ember.get(this, 'query')
          }).catch(error => this.set('errorMessage', error));
        }
      },

      openModal() {
        this.set('showModal', true);
      },

      addNewCollectionHelper() {
        let addNewCollectionParent = this.addNewCollection;
        addNewCollectionParent();
      },

      addToCollection(pipelineId, collection) {
        return this.addToCollection(+pipelineId, collection.id).then(() => {
          this.set('addCollectionError', null);
          this.set('addCollectionSuccess', "Successfully added Pipeline to Collection ".concat(collection.get('name')));
        }).catch(() => {
          this.set('addCollectionError', "Could not add Pipeline to Collection ".concat(collection.get('name')));
          this.set('addCollectionSuccess', null);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/search-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "Tp51GxVK",
    "block": "{\"symbols\":[\"pipeline\"],\"statements\":[[4,\"if\",[[25,[\"addCollectionError\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"addCollectionError\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"addCollectionSuccess\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"addCollectionSuccess\"]],\"success\",\"check\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[7,\"div\"],[11,\"class\",\"num-results\"],[9],[0,\"\\n  \"],[1,[29,\"if\",[[25,[\"isEmpty\"]],\"No results\",[29,\"concat\",[\"Showing \",[25,[\"filteredPipelines\",\"length\"]],\" result(s)\"],null]],null],false],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"table\"],[9],[0,\"\\n  \"],[7,\"thead\"],[9],[0,\"\\n    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"appId\"],[9],[0,\"Name\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"branch\"],[9],[0,\"Branch\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"account\"],[9],[0,\"Account\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"        \"],[7,\"th\"],[11,\"class\",\"add\"],[9],[0,\"Add to Collection\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"filteredPipelines\"]]],null,{\"statements\":[[0,\"      \"],[7,\"tr\"],[9],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"appId\"],[9],[4,\"highlight-terms\",[[25,[\"query\"]]],null,{\"statements\":[[4,\"link-to\",[\"pipeline\",[24,1,[\"id\"]]],null,{\"statements\":[[1,[24,1,[\"appId\"]],false]],\"parameters\":[]},null]],\"parameters\":[]},null],[10],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"branch\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"aria-hidden\",\"true\"],[9],[10],[1,[24,1,[\"branch\"]],false],[10],[0,\"\\n        \"],[7,\"td\"],[11,\"class\",\"account\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[24,1,[\"scmIcon\"]]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[24,1,[\"scm\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"          \"],[7,\"td\"],[11,\"class\",\"add\"],[9],[0,\"\\n            \"],[1,[29,\"collection-dropdown\",null,[[\"pipeline\",\"collections\",\"addToCollection\",\"addCollectionError\",\"addCollectionSuccess\"],[[24,1,[]],[25,[\"collections\"]],[25,[\"addToCollection\"]],[25,[\"addCollectionError\"]],[25,[\"addCollectionSuccess\"]]]]],false],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"showMore\"]]],null,{\"statements\":[[0,\"  \"],[7,\"a\"],[11,\"class\",\"showMore\"],[9],[0,\"Show more results...\"],[3,\"action\",[[24,0,[]],\"moreClick\"]],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"collection-modal\",null,[[\"showModal\",\"addNewCollection\"],[[25,[\"showModal\"]],[25,[\"addNewCollection\"]]]]],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/search-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/secret-view/component", ["exports", "jquery"], function (_exports, _jquery) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    tagName: 'tr',
    newValue: null,
    originalAllowInPR: null,
    buttonAction: Ember.computed('newValue', 'secret.allowInPR', 'originalAllowInPR', {
      get() {
        const {
          secret,
          pipeline
        } = this;

        if (pipeline.get('configPipelineId')) {
          if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
            return 'Override';
          }

          return this.newValue || this.originalAllowInPR !== this.get('secret.allowInPR') ? 'Update' : 'Revert';
        }

        return this.newValue || this.originalAllowInPR !== this.get('secret.allowInPR') ? 'Update' : 'Delete';
      }

    }),
    passwordPlaceholder: Ember.computed({
      get() {
        const {
          secret,
          pipeline
        } = this;

        if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
          return 'Inherited from parent pipeline';
        }

        return 'Protected';
      }

    }),

    init() {
      this._super(...arguments);

      this.set('originalAllowInPR', this.get('secret.allowInPR'));
    },

    actions: {
      modifySecret() {
        const {
          secret
        } = this;

        if (this.buttonAction === 'Delete' || this.buttonAction === 'Revert') {
          return secret.destroyRecord().then(() => {
            this.secrets.store.unloadRecord(secret);
            this.secrets.reload();
          });
        }

        if (this.buttonAction === 'Update') {
          if (this.newValue) {
            secret.set('value', this.newValue);
          }

          secret.save();
          this.set('newValue', null);
          this.set('originalAllowInPR', secret.get('allowInPR'));
        } else if (this.newValue) {
          // Create child pipeline secret to override inherited secret of same name
          return this.onCreateSecret(secret.get('name'), this.newValue, this.get('pipeline.id'), secret.get('allowInPR'));
        }

        return Promise.resolve(null);
      },

      /**
       * Toggle eye-icon and password input type
       * @method togglePasswordInput
       * @param {Object} event Click event
       */
      togglePasswordInput(event) {
        const {
          target
        } = event;
        const passwordInput = target.previousSibling;
        (0, _jquery.default)(target).toggleClass('fa-eye fa-eye-slash');

        if ((0, _jquery.default)(passwordInput).attr('type') === 'password') {
          (0, _jquery.default)(passwordInput).attr('type', 'text');
        } else {
          (0, _jquery.default)(passwordInput).attr('type', 'password');
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/secret-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "1R7avWrF",
    "block": "{\"symbols\":[],\"statements\":[[7,\"td\"],[11,\"class\",\"name\"],[9],[1,[25,[\"secret\",\"name\"]],false],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"pass\"],[9],[1,[29,\"input\",null,[[\"type\",\"placeholder\",\"size\",\"value\"],[\"password\",[25,[\"passwordPlaceholder\"]],\"40\",[25,[\"newValue\"]]]]],false],[7,\"i\"],[11,\"class\",\"fa fa-eye toggle-icon\"],[11,\"aria-hidden\",\"true\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"togglePasswordInput\"],null]],[9],[10],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"allow\"],[9],[1,[29,\"input\",null,[[\"type\",\"checked\"],[\"checkbox\",[25,[\"secret\",\"allowInPR\"]]]]],false],[10],[0,\"\\n\"],[7,\"td\"],[9],[7,\"button\"],[9],[1,[23,\"buttonAction\"],false],[3,\"action\",[[24,0,[]],\"modifySecret\"]],[10],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/secret-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/tc-collection-linker/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/components/tc-collection-linker/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "DyaOYeqg",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"column\",\"label\"]],\"Name\"],null]],null,{\"statements\":[[0,\"  \"],[4,\"link-to\",[[25,[\"extra\",\"routes\",\"detail\"]],[25,[\"row\",\"content\",\"namespace\"]],[25,[\"value\"]]],null,{\"statements\":[[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[23,\"value\"],false],[10]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"column\",\"label\"]],\"Namespace\"],null]],null,{\"statements\":[[0,\"  \"],[4,\"link-to\",[[25,[\"extra\",\"routes\",\"namespace\"]],[25,[\"value\"]]],null,{\"statements\":[[7,\"span\"],[11,\"class\",\"namespace\"],[9],[1,[23,\"value\"],false],[10]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]}]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/tc-collection-linker/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/tc-collection-list/component", ["exports", "ember-light-table"], function (_exports, _emberLightTable) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNames: [''],
    table: null,
    model: null,
    search: null,
    query: null,
    collectionType: null,
    collectionDescription: null,
    routes: Ember.computed('collectionType', {
      get() {
        const prefix = this.collectionType.toLowerCase();
        return {
          prefix,
          detail: "".concat(prefix, ".detail"),
          namespace: "".concat(prefix, ".namespace")
        };
      }

    }),
    filteringNamespace: null,
    filteringMaintainer: null,
    sort: 'createTime',
    dir: 'desc',

    init() {
      this._super(...arguments);

      let table = new _emberLightTable.default(this.columns, this.refinedModel);
      let sortColumn = table.get('allColumns').findBy('valuePath', this.sort); // Setup initial sort column

      if (sortColumn) {
        sortColumn.set('sorted', true);
      }

      this.set('table', table);
    },

    filteredModel: Ember.computed('filteringNamespace', 'filteringMaintainer', 'search', 'model', {
      get() {
        const ns = this.filteringNamespace;
        const maintainer = this.filteringMaintainer;
        const {
          search
        } = this;
        return this.model.filter(m => {
          let result = true;

          if (ns) {
            result = result && m.namespace === ns;
          }

          if (result && maintainer) {
            result = result && m.maintainer === maintainer;
          }

          if (result && search) {
            result = result && (m.namespace.includes(search) || m.name.includes(search) || m.description.includes(search) || m.maintainer.includes(search));
          }

          return result;
        });
      }

    }),
    refinedModel: Ember.computed.sort('filteredModel', 'sortBy'),
    sortBy: Ember.computed('dir', 'sort', {
      get() {
        return ["".concat(this.sort, ":").concat(this.dir)];
      }

    }),
    namespaces: Ember.computed('model', {
      get() {
        return this.model.mapBy('namespace').uniq().sort();
      }

    }),
    maintainers: Ember.computed('model', {
      get() {
        return this.model.mapBy('maintainer').uniq().sort();
      }

    }),
    columns: Ember.computed(() => [{
      label: 'Name',
      valuePath: 'name',
      cellComponent: 'tc-collection-linker',
      resizable: true,
      width: '20%',
      minResizeWidth: 175
    }, {
      label: 'Description',
      sortable: false,
      valuePath: 'description',
      resizable: true,
      width: '30%',
      minResizeWidth: 350
    }, {
      label: 'Namespace',
      valuePath: 'namespace',
      cellComponent: 'tc-collection-linker',
      resizable: true,
      width: '15%',
      minResizeWidth: 150
    }, {
      label: 'Updated',
      valuePath: 'lastUpdated',
      resizable: true,
      width: '10%',
      minResizeWidth: 100
    }, {
      label: 'Version',
      sortable: false,
      valuePath: 'version',
      resizable: true,
      width: '10%',
      minResizeWidth: 100
    }, {
      label: 'Released By',
      sortable: true,
      valuePath: 'maintainer',
      resizable: true,
      width: '15%',
      minResizeWidth: 150
    }]),

    refineModel() {
      this.table.setRows(this.refinedModel);
    },

    onSearch() {
      const search = this.query.trim();
      this.set('search', search);

      if (!search) {
        if (this.filteringNamespace) {
          this.set('maintainers', this.filteredModel.mapBy('maintainer').uniq().sort());
        }

        if (this.filteringMaintainer) {
          this.set('namespaces', this.filteredModel.mapBy('namespace').uniq().sort());
        }
      }

      this.refineModel();
    },

    // eslint-disable-next-line ember/no-observers
    onQuery: Ember.observer('query', function onSearchChange() {
      Ember.run.debounce(this, 'onSearch', 250);
    }),
    actions: {
      sortByColumn(column) {
        if (column.sorted) {
          let vp = column.get('valuePath');
          this.setProperties({
            dir: column.ascending ? 'asc' : 'desc',
            sort: vp === 'lastUpdated' ? 'createTime' : vp
          });
          this.refineModel();
        }
      },

      onFilterNamespace(ns) {
        this.set('filteringNamespace', ns || null);
        this.set('maintainers', this.get(ns ? 'filteredModel' : 'model').mapBy('maintainer').uniq().sort());

        if (!ns) {
          this.set('namespaces', this.filteredModel.mapBy('namespace').uniq().sort());
        }

        this.refineModel();
      },

      onFilterMaintainer(m) {
        this.set('filteringMaintainer', m || null);
        this.set('namespaces', this.get(m ? 'filteredModel' : 'model').mapBy('namespace').uniq().sort());

        if (!m) {
          this.set('maintainers', this.filteredModel.mapBy('maintainer').uniq().sort());
        }

        this.refineModel();
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/tc-collection-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "+eCY1w44",
    "block": "{\"symbols\":[\"t\",\"body\",\"m\",\"ns\",\"&default\"],\"statements\":[[7,\"header\"],[9],[0,\"\\n  \"],[7,\"h4\"],[9],[0,\"\\n    \"],[1,[23,\"collectionType\"],false],[0,\"\\n    \"],[7,\"a\"],[12,\"href\",[30,[\"http://docs.screwdriver.cd/user-guide/\",[25,[\"routes\",\"prefix\"]]]]],[11,\"title\",\"More Information\"],[11,\"target\",\"_blank\"],[11,\"rel\",\"noopener\"],[11,\"class\",\"link pull-right\"],[9],[1,[23,\"collectionType\"],false],[0,\" Docs \"],[7,\"i\"],[11,\"class\",\"fa fa-question-circle\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"collection-description\"],[9],[15,5],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"section\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"h5\"],[9],[0,\"\\n    \"],[7,\"b\"],[9],[0,\"Screwdriver \"],[1,[23,\"collectionType\"],false],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"pull-right\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"text-uppercase total\"],[9],[0,\"Total \"],[10],[7,\"span\"],[9],[1,[25,[\"filteredModel\",\"length\"]],false],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"col-sm-3\"],[9],[0,\"\\n      \"],[7,\"select\"],[12,\"onchange\",[29,\"action\",[[24,0,[]],\"onFilterNamespace\"],[[\"value\"],[\"target.value\"]]]],[9],[0,\"\\n        \"],[7,\"option\"],[11,\"value\",\"\"],[9],[0,\"All Namespaces\"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"namespaces\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[24,4,[]],[25,[\"filteringNamespace\"]]],null]],null,{\"statements\":[[0,\"            \"],[7,\"option\"],[12,\"value\",[24,4,[]]],[11,\"selected\",\"selected\"],[9],[1,[24,4,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[7,\"option\"],[12,\"value\",[24,4,[]]],[9],[1,[24,4,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[4]},null],[0,\"      \"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"control-icon\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-sm-3\"],[9],[0,\"\\n      \"],[7,\"select\"],[12,\"onchange\",[29,\"action\",[[24,0,[]],\"onFilterMaintainer\"],[[\"value\"],[\"target.value\"]]]],[9],[0,\"\\n        \"],[7,\"option\"],[11,\"value\",\"\"],[9],[0,\"All Maintainers\"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"maintainers\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"ns\"]],[25,[\"filteringMaintainer\"]]],null]],null,{\"statements\":[[0,\"            \"],[7,\"option\"],[12,\"value\",[24,3,[]]],[11,\"selected\",\"selected\"],[9],[1,[24,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[7,\"option\"],[12,\"value\",[24,3,[]]],[9],[1,[24,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[3]},null],[0,\"      \"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"control-icon\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n\\n    \"],[7,\"div\"],[11,\"class\",\"col-sm-6\"],[9],[0,\"\\n      \"],[7,\"input\"],[11,\"value\",\"\"],[12,\"placeholder\",[30,[\"Search \",[23,\"collectionType\"]]]],[12,\"oninput\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"query\"]]],null]],[[\"value\"],[\"target.value\"]]]],[11,\"type\",\"search\"],[9],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"control-icon\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-search\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n\"],[4,\"light-table\",[[25,[\"table\"]]],[[\"height\",\"responsive\",\"classNames\",\"tableClassNames\",\"extra\"],[\"75vh\",true,\"collection-list\",\"collection-list-table\",[29,\"hash\",null,[[\"routes\"],[[25,[\"routes\"]]]]]]],{\"statements\":[[0,\"    \"],[1,[29,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"head\"]],\"expected `t.head` to be a contextual component but found a string. Did you mean `(component t.head)`? ('screwdriver-ui/components/tc-collection-list/template.hbs' @ L60:C6) \"],null]],[[\"onColumnClick\",\"iconSortable\",\"iconAscending\",\"iconDescending\",\"resizeOnDrag\"],[[29,\"action\",[[24,0,[]],\"sortByColumn\"],null],\"fa fa-sort\",\"fa fa-sort-asc\",\"fa fa-sort-desc\",true]]],false],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"body\"]],\"expected `t.body` to be a contextual component but found a string. Did you mean `(component t.body)`? ('screwdriver-ui/components/tc-collection-list/template.hbs' @ L67:C7) \"],null]],[[\"canSelect\"],[false]],{\"statements\":[[4,\"if\",[[25,[\"table\",\"isEmpty\"]]],null,{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,2,[\"no-data\"]],\"expected `body.no-data` to be a contextual component but found a string. Did you mean `(component body.no-data)`? ('screwdriver-ui/components/tc-collection-list/template.hbs' @ L69:C11) \"],null]],null,{\"statements\":[[0,\"          Sorry. No result is found for \"],[7,\"b\"],[9],[7,\"i\"],[9],[1,[23,\"search\"],false],[10],[10],[0,\"\\n          \"],[4,\"if\",[[25,[\"filteringNamespace\"]]],null,{\"statements\":[[0,\" under \"],[7,\"b\"],[9],[7,\"i\"],[9],[1,[23,\"filteringNamespace\"],false],[10],[10]],\"parameters\":[]},null],[0,\"\\n          \"],[4,\"if\",[[25,[\"filteringMaintainer\"]]],null,{\"statements\":[[0,\" by \"],[7,\"b\"],[9],[7,\"i\"],[9],[1,[23,\"filteringMaintainer\"],false],[10],[10]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"parameters\":[2]},null]],\"parameters\":[1]},null],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/tc-collection-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/template-header/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    templateToRemove: null,
    scmUrl: null,
    isRemoving: false,
    store: Ember.inject.service(),

    init() {
      this._super(...arguments);

      this.store.findRecord('pipeline', this.template.pipelineId).then(pipeline => {
        this.set('scmUrl', pipeline.get('scmRepo.url'));
      }).catch(() => {
        this.set('scmUrl', null);
      });
    },

    actions: {
      setTemplateToRemove(template) {
        this.set('templateToRemove', template);
      },

      cancelRemovingTemplate() {
        this.set('templateToRemove', null);
        this.set('isRemoving', false);
      },

      removeTemplate(name) {
        this.set('isRemoving', true);
        this.onRemoveTemplate(name).then(() => {
          this.set('templateToRemove', null);
          this.set('isRemoving', false);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/template-header/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "Vtbe7r4N",
    "block": "{\"symbols\":[\"modal\",\"l\"],\"statements\":[[7,\"h1\"],[9],[0,\"\\n  \"],[1,[25,[\"template\",\"fullName\"]],false],[0,\"\\n\"],[4,\"if\",[[25,[\"scmUrl\"]]],null,{\"statements\":[[0,\"    \"],[7,\"a\"],[12,\"href\",[23,\"scmUrl\"]],[9],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"title\",\"Source code\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\" \"],[7,\"a\"],[11,\"href\",\"#\"],[11,\"class\",\"remove\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"title\",\"Delete template\"],[11,\"aria-hidden\",\"true\"],[9],[10],[3,\"action\",[[24,0,[]],\"setTemplateToRemove\",[25,[\"template\"]]]],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"i\"],[11,\"class\",\"fa fa-code-fork\"],[11,\"title\",\"The pipeline for this template does not exist.\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"title\",\"Cannot delete template; pipeline could not be found.\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n\"]],\"parameters\":[]}],[10],[0,\"\\n\"],[7,\"h2\"],[9],[1,[25,[\"template\",\"version\"]],false],[10],[0,\"\\n\"],[7,\"p\"],[9],[1,[25,[\"template\",\"description\"]],false],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"template\",\"namespace\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"template-details--item\"],[11,\"id\",\"template-namespace\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--label\"],[9],[0,\"Namespace:\"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--value\"],[9],[1,[25,[\"template\",\"namespace\"]],false],[10],[0,\"\\n    \"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"template-details--item\"],[11,\"id\",\"template-name\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--label\"],[9],[0,\"Name:\"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--value\"],[9],[1,[25,[\"template\",\"name\"]],false],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"],[7,\"div\"],[11,\"class\",\"template-details--item\"],[11,\"id\",\"template-maintainer\"],[9],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"template-details--label\"],[9],[0,\"Released by:\"],[10],[0,\"\\n    \"],[7,\"div\"],[11,\"class\",\"template-details--value\"],[9],[0,\"\\n      \"],[7,\"a\"],[12,\"href\",[30,[\"mailto:\",[25,[\"template\",\"maintainer\"]]]]],[9],[1,[25,[\"template\",\"maintainer\"]],false],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"template\",\"labels\",\"length\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"template-details--item\"],[11,\"id\",\"template-tags\"],[9],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--label\"],[9],[0,\"Tags:\"],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"template-details--value\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"template\",\"labels\"]]],null,{\"statements\":[[0,\"          \"],[7,\"span\"],[11,\"class\",\"template-label\"],[9],[1,[24,2,[]],false],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[7,\"h4\"],[9],[0,\"Usage:\"],[10],[0,\"\\n\"],[7,\"pre\"],[9],[0,\"jobs:\\n  main:\\n    template: \"],[1,[25,[\"template\",\"fullName\"]],false],[0,\"@\"],[1,[25,[\"template\",\"version\"]],false],[0,\"\"],[10],[0,\"\"],[4,\"if\",[[25,[\"templateToRemove\"]]],null,{\"statements\":[[4,\"if\",[[25,[\"isRemoving\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[\"false\",\"center\",true]],{\"statements\":[[0,\"      \"],[1,[23,\"loading-view\"],false],[0,\"\"]],\"parameters\":[]},null]],\"parameters\":[]},{\"statements\":[[4,\"bs-modal\",null,[[\"onSubmit\",\"onHide\"],[[29,\"action\",[[24,0,[]],\"removeTemplate\",[25,[\"template\",\"fullName\"]]],null],[29,\"action\",[[24,0,[]],\"cancelRemovingTemplate\"],null]]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"header\"]],\"expected `modal.header` to be a contextual component but found a string. Did you mean `(component modal.header)`? ('screwdriver-ui/components/template-header/template.hbs' @ L53:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"h4\"],[9],[0,\"Are you sure?\"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"body\"]],\"expected `modal.body` to be a contextual component but found a string. Did you mean `(component modal.body)`? ('screwdriver-ui/components/template-header/template.hbs' @ L56:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[7,\"i\"],[11,\"class\",\"fa fa-3x fa-exclamation-triangle fa-pull-left\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\"\\n        You're about to delete all versions and tags of \"],[7,\"strong\"],[9],[1,[25,[\"template\",\"fullName\"]],false],[10],[0,\". There might be existing pipelines using this template.\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"footer\"]],\"expected `modal.footer` to be a contextual component but found a string. Did you mean `(component modal.footer)`? ('screwdriver-ui/components/template-header/template.hbs' @ L60:C9) \"],null]],null,{\"statements\":[[0,\"        \"],[4,\"bs-button\",null,[[\"onClick\"],[[29,\"action\",[[24,0,[]],\"cancelRemovingTemplate\"],null]]],{\"statements\":[[0,\"Cancel\"]],\"parameters\":[]},null],[0,\"\\n        \"],[4,\"bs-button\",null,[[\"onClick\",\"type\"],[[29,\"action\",[[24,0,[]],\"removeTemplate\",[25,[\"template\",\"fullName\"]]],null],\"danger\"]],{\"statements\":[[7,\"i\"],[11,\"class\",\"fa fa-trash\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Confirm\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/template-header/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/template-versions/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/components/template-versions/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "uxf39Bgk",
    "block": "{\"symbols\":[\"t\"],\"statements\":[[7,\"h4\"],[9],[0,\"Versions:\"],[10],[0,\"\\n\"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"templates\"]]],null,{\"statements\":[[0,\"    \"],[7,\"li\"],[9],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"version\"],[9],[1,[24,1,[\"version\"]],false],[4,\"if\",[[24,1,[\"tag\"]]],null,{\"statements\":[[0,\" - \"],[1,[24,1,[\"tag\"]],false]],\"parameters\":[]},null],[3,\"action\",[[24,0,[]],[25,[\"changeVersion\"]],[24,1,[\"version\"]]],[[\"on\"],[\"click\"]]],[10],[4,\"if\",[[24,1,[\"lastUpdated\"]]],null,{\"statements\":[[0,\" \"],[1,[24,1,[\"lastUpdated\"]],false]],\"parameters\":[]},null],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/template-versions/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/token-list/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    tokenSorting: ['name', 'description', 'lastUsed'],
    // Error for failed to create/update/remove/refresh token
    errorMessage: null,
    // Adding a new token
    isSaving: false,
    newDescription: null,
    newName: null,
    // Confirmation dialog
    isShowingModal: false,
    modalAction: null,
    modalTarget: null,
    modalText: null,
    sortedTokens: Ember.computed.sort('tokens', 'tokenSorting'),
    isButtonDisabled: Ember.computed('newName', 'isSaving', function isButtonDisabled() {
      return !this.newName || this.isSaving;
    }),
    modalButtonText: Ember.computed('modalAction', function modalButtonText() {
      return Ember.String.capitalize(this.modalAction);
    }),
    // Don't show the "new token" and "error" dialogs at the same time
    // eslint-disable-next-line ember/no-observers
    errorObserver: Ember.observer('errorMessage', function errorObserver() {
      if (this.errorMessage) {
        this.set('newToken', null);
        this.set('isSaving', null);
      }
    }),
    // eslint-disable-next-line ember/no-observers
    newTokenObserver: Ember.observer('newToken', function newTokenObserver() {
      if (this.newToken) {
        this.set('errorMessage', null);
        this.set('isSaving', null);
      }
    }),

    willClearRender() {
      this._super(...arguments);

      this.set('newToken', null);
    },

    actions: {
      /**
       * Kicks off create token flow
       * @method addNewToken
       */
      addNewToken() {
        this.set('isSaving', true);
        return this.onCreateToken(this.newName, this.newDescription).then(() => {
          this.set('newName', null);
          this.set('newDescription', null);
        }).catch(error => {
          this.set('errorMessage', error.errors[0].detail);
        });
      },

      /**
       * Clear the new token
       * @method clearNewToken
       */
      clearNewToken() {
        this.set('newToken', null);
      },

      /**
       * Set the error to be displayed from child components
       * @param {String} errorMessage
       */
      setErrorMessage(errorMessage) {
        this.set('errorMessage', errorMessage);
      },

      /**
       * Show or hide the saving modal from child components
       * @param {Boolean} isSaving
       */
      setIsSaving(isSaving) {
        this.set('isSaving', isSaving);
      },

      /**
       * Confirm an action
       * @method confirmAction
       * @param {String} action   One of "refresh" or "revoke"
       * @param {Number} id
       */
      confirmAction(action, id) {
        this.set('modalTarget', this.tokens.find(token => token.get('id') === id));
        this.set('modalAction', action);

        if (action === 'delete') {
          this.set('modalText', "The \"".concat(this.get('modalTarget.name'), "\" token will be deleted."));
        } else {
          this.set('modalText', "The current \"".concat(this.get('modalTarget.name'), "\" token will be invalidated."));
        }

        this.set('isShowingModal', true);
      },

      /**
       * Close the modal, calling a callback if necessary
       * @method closeModal
       * @param {Boolean} confirm
       */
      closeModal(confirm) {
        this.set('isShowingModal', false);

        if (confirm) {
          if (this.modalAction === 'delete') {
            this.modalTarget.destroyRecord({
              adapterOptions: {
                pipelineId: this.pipelineId
              }
            });
          } else {
            this.set('isSaving', true);
            this.onRefreshToken(this.get('modalTarget.id')).catch(error => {
              this.set('errorMessage', error.errors[0].detail);
            });
          }
        }
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/token-list/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "qDa0ppCQ",
    "block": "{\"symbols\":[\"token\"],\"statements\":[[7,\"h3\"],[9],[0,\"Access Tokens\"],[10],[0,\"\\n\"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"],[4,\"if\",[[25,[\"newToken\"]]],null,{\"statements\":[[4,\"bs-alert\",null,[[\"type\",\"onDismissed\"],[\"success\",[29,\"action\",[[24,0,[]],\"clearNewToken\"],null]]],{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"new-token\"],[9],[0,\"\\n      \"],[7,\"p\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-check\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Token \"],[1,[25,[\"newToken\",\"action\"]],false],[0,\". You can only see this value once, so remember to copy it!\"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"new-name\"],[9],[1,[25,[\"newToken\",\"name\"]],false],[0,\":\"],[10],[0,\"\\n      \"],[7,\"span\"],[11,\"class\",\"new-value\"],[9],[1,[25,[\"newToken\",\"value\"]],false],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[7,\"p\"],[9],[0,\"\\n  \"],[1,[23,\"tokenName\"],false],[0,\" tokens provide access to the \"],[7,\"a\"],[11,\"href\",\"http://docs.screwdriver.cd/user-guide/api\"],[9],[0,\"Screwdriver API\"],[10],[0,\". They are scoped to \"],[1,[23,\"tokenScope\"],false],[0,\".\\n\"],[10],[0,\"\\n\"],[7,\"table\"],[11,\"class\",\"token-list\"],[9],[0,\"\\n  \"],[7,\"thead\"],[9],[0,\"\\n    \"],[7,\"tr\"],[9],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"token-name\"],[9],[0,\"Name\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"token-description\"],[9],[0,\"Description\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"last-used\"],[9],[0,\"Last Used\"],[10],[0,\"\\n      \"],[7,\"th\"],[11,\"class\",\"actions\"],[9],[0,\"Actions\"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"tbody\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"sortedTokens\"]]],null,{\"statements\":[[0,\"      \"],[1,[29,\"token-view\",null,[[\"token\",\"pipelineId\",\"confirmAction\",\"setErrorMessage\",\"setIsSaving\"],[[24,1,[]],[25,[\"pipelineId\"]],[29,\"action\",[[24,0,[]],\"confirmAction\"],null],[29,\"action\",[[24,0,[]],\"setErrorMessage\"],null],[29,\"action\",[[24,0,[]],\"setIsSaving\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n  \"],[7,\"tfoot\"],[9],[0,\"\\n    \"],[7,\"tr\"],[11,\"class\",\"new\"],[9],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"name\"],[9],[1,[29,\"input\",null,[[\"placeholder\",\"size\",\"value\"],[\"NAME\",\"40\",[25,[\"newName\"]]]]],false],[10],[0,\"\\n      \"],[7,\"td\"],[11,\"class\",\"description\"],[11,\"colspan\",\"2\"],[9],[1,[29,\"input\",null,[[\"placeholder\",\"size\",\"value\"],[\"DESCRIPTION\",\"40\",[25,[\"newDescription\"]]]]],false],[10],[0,\"\\n      \"],[7,\"td\"],[9],[7,\"button\"],[11,\"class\",\"add\"],[12,\"disabled\",[23,\"isButtonDisabled\"]],[9],[0,\"Add\"],[3,\"action\",[[24,0,[]],\"addNewToken\"]],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"translucentOverlay\",\"onClickOverlay\"],[true,[29,\"action\",[[24,0,[]],\"closeModal\",false],null]]],{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"token-confirm-dialog\"],[9],[0,\"\\n      \"],[7,\"h3\"],[9],[0,\"Are you sure?\"],[10],[0,\"\\n      \"],[7,\"p\"],[9],[1,[23,\"modalText\"],false],[10],[0,\"\\n      \"],[7,\"button\"],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"closeModal\",true],null]],[12,\"class\",[23,\"modalAction\"]],[9],[0,\"\\n        \"],[1,[23,\"modalButtonText\"],false],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[4,\"if\",[[25,[\"isSaving\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[false,\"center\",true]],{\"statements\":[[0,\"    \"],[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/token-list/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/token-view/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    newDescription: null,
    newName: null,
    tagName: 'tr',
    pipelineId: null,
    buttonAction: Ember.computed('token.{name,description}', 'newName', 'newDescription', {
      get() {
        const {
          token
        } = this;
        return this.newName !== token.get('name') || this.newDescription !== token.get('description') ? 'Update' : 'Delete';
      }

    }),

    init() {
      this._super(...arguments);

      this.set('newName', this.get('token.name'));
      this.set('newDescription', this.get('token.description') || '');
    },

    actions: {
      modifyToken(pipelineId) {
        const {
          token
        } = this;

        if (this.buttonAction === 'Delete') {
          this.confirmAction('delete', this.get('token.id'));
        } else {
          token.set('name', this.newName);
          token.set('description', this.newDescription);
          this.setIsSaving(true);

          if (pipelineId) {
            token.save({
              adapterOptions: {
                pipelineId
              }
            }).then(() => {
              this.setIsSaving(false);
            }).catch(error => {
              this.setErrorMessage(error.errors[0].detail);
            });
          } else {
            token.save().then(() => {
              this.setIsSaving(false);
            }).catch(error => {
              this.setErrorMessage(error.errors[0].detail);
            });
          }
        }
      },

      refresh() {
        this.confirmAction('refresh', this.get('token.id'));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/token-view/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "FdqEh8qV",
    "block": "{\"symbols\":[],\"statements\":[[7,\"td\"],[11,\"class\",\"name\"],[9],[1,[29,\"input\",null,[[\"type\",\"size\",\"value\"],[\"text\",\"40\",[25,[\"newName\"]]]]],false],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"description\"],[9],[1,[29,\"input\",null,[[\"type\",\"size\",\"value\"],[\"text\",\"40\",[25,[\"newDescription\"]]]]],false],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"last-used\"],[9],[4,\"if\",[[25,[\"token\",\"lastUsed\"]]],null,{\"statements\":[[1,[29,\"moment-from-now\",[[25,[\"token\",\"lastUsed\"]]],null],false]],\"parameters\":[]},{\"statements\":[[0,\"Never used\"]],\"parameters\":[]}],[10],[0,\"\\n\"],[7,\"td\"],[11,\"class\",\"actions\"],[9],[0,\"\\n  \"],[7,\"button\"],[9],[0,\"Refresh\"],[3,\"action\",[[24,0,[]],\"refresh\"]],[10],[0,\"\\n  \"],[7,\"button\"],[12,\"class\",[23,\"buttonAction\"]],[9],[1,[23,\"buttonAction\"],false],[3,\"action\",[[24,0,[]],\"modifyToken\",[25,[\"pipelineId\"]]]],[10],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/token-view/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/user-link/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNameBindings: ['large']
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/user-link/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "ClQZU7Tf",
    "block": "{\"symbols\":[],\"statements\":[[7,\"a\"],[12,\"href\",[25,[\"user\",\"url\"]]],[12,\"title\",[23,\"causeMessage\"]],[9],[0,\"\\n  \"],[7,\"img\"],[12,\"src\",[25,[\"user\",\"avatar\"]]],[12,\"alt\",[30,[[25,[\"user\",\"name\"]],\"'s avatar\"]]],[9],[10],[0,\"\\n  \"],[1,[25,[\"user\",\"name\"]],false],[0,\"\\n\"],[10],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/user-link/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-input/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-input/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "9bUDE/R0",
    "block": "{\"symbols\":[\"&default\"],\"statements\":[[7,\"h3\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-check-square-o\"],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Validate Screwdriver Configuration\"],[10],[0,\"\\n\"],[1,[29,\"ember-ace\",null,[[\"value\",\"update\",\"tabSize\",\"useSoftTabs\",\"minLines\",\"maxLines\",\"showPrintMargin\",\"useWrapMode\",\"highlightActiveLine\"],[[25,[\"yaml\"]],[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"yaml\"]]],null]],null],4,true,10,75,false,false,true]]],false],[0,\"\\n\"],[15,1]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/validator-input/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-job/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNameBindings: ['hasParseError', 'collapsible'],
    isOpen: true,
    collapsible: true,
    hasParseError: Ember.computed('job', {
      get() {
        return this.get('job.commands.0.name') === 'config-parse-error';
      }

    }),
    steps: Ember.computed('job', {
      get() {
        let c = this.get('job.commands');

        if (c) {
          return c;
        } // Templates have a different output


        c = this.get('job.steps');

        if (c) {
          return c.map(s => {
            const name = Object.keys(s)[0];
            const command = s[name];
            return {
              name,
              command
            };
          });
        }

        return [];
      }

    }),
    actions: {
      nameClick() {
        this.toggleProperty('isOpen');
        this.$('div').toggle('hidden');
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-job/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "gHyNDXUO",
    "block": "{\"symbols\":[\"svalue\",\"name\",\"xvalue\",\"xname\",\"value\",\"name\",\"secretName\",\"path\",\"command\",\"value\",\"name\",\"value\",\"name\",\"&default\"],\"statements\":[[4,\"if\",[[25,[\"collapsible\"]]],null,{\"statements\":[[0,\"  \"],[7,\"h4\"],[11,\"class\",\"job\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[29,\"if\",[[25,[\"isOpen\"]],\"minus-square\",\"plus-square\"],null]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" \"],[1,[23,\"name\"],false],[4,\"if\",[[25,[\"index\"]]],null,{\"statements\":[[0,\".\"],[1,[23,\"index\"],false]],\"parameters\":[]},null],[3,\"action\",[[24,0,[]],\"nameClick\"]],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"template\",\"description\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"template-description\"],[11,\"title\",\"This is the description of the template\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Template Description:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"template\",\"description\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"if\",[[25,[\"template\",\"images\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"images\"],[11,\"title\",\"Supported images\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Supported Images:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n      \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[25,[\"template\",\"images\"]]],null]],null,{\"statements\":[[0,\"          \"],[7,\"li\"],[9],[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[24,13,[]],false],[0,\": \"],[10],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[24,12,[]],false],[10],[10],[0,\"\\n\"]],\"parameters\":[12,13]},{\"statements\":[[0,\"          \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[7,\"div\"],[11,\"class\",\"annotations\"],[11,\"title\",\"These are the job-level annotations that the user has defined.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Annotations:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[25,[\"job\",\"annotations\"]]],null]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[24,11,[]],false],[0,\": \"],[10],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[24,10,[]],false],[10],[10],[0,\"\\n\"]],\"parameters\":[10,11]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[4,\"unless\",[[25,[\"template\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"description\"],[11,\"title\",\"This is the description of the job\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Description:\"],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"job\",\"description\"]],false],[10],[0,\"\\n  \"],[10],[0,\"\\n\"]],\"parameters\":[]},null],[7,\"div\"],[11,\"class\",\"image\"],[11,\"title\",\"This is the docker image that acts as the base container for the job.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Image:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[25,[\"job\",\"image\"]],false],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"steps\"],[11,\"title\",\"These are the commands that will be executed in the job.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Steps:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"steps\"]]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[7,\"div\"],[11,\"class\",\"name\"],[9],[1,[24,9,[\"name\"]],false],[0,\": \"],[10],[7,\"div\"],[11,\"class\",\"value\"],[9],[1,[24,9,[\"command\"]],false],[10],[10],[0,\"\\n\"]],\"parameters\":[9]},null],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"sourcePaths\"],[11,\"title\",\"These are the source paths that will trigger a job upon modification. If you want to specify a directory, make sure it has a trailing slash (/).\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Source Paths:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"job\",\"sourcePaths\"]]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[1,[24,8,[]],false],[10],[0,\"\\n\"]],\"parameters\":[8]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"secrets\"],[11,\"title\",\"These are the keys for secrets that will be available in this job.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Secrets:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"job\",\"secrets\"]]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[1,[24,7,[]],false],[10],[0,\"\\n\"]],\"parameters\":[7]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"env\"],[11,\"title\",\"These are the environment variables you have added to the job.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Environment Variables:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[25,[\"job\",\"environment\"]]],null]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[24,6,[]],false],[0,\": \"],[10],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[24,5,[]],false],[10],[10],[0,\"\\n\"]],\"parameters\":[5,6]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"settings\"],[11,\"title\",\"These settings are used to configure any additional build plugins added to screwdriver.cd. Configure email and slack notifications for build events here.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Settings:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[25,[\"job\",\"settings\"]]],null]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"\\n          \"],[7,\"div\"],[11,\"class\",\"value-item\"],[9],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"name\"],[9],[1,[24,2,[]],false],[0,\": \"],[10],[0,\"\\n            \"],[7,\"div\"],[11,\"class\",\"value\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[24,1,[]]],null]],null,{\"statements\":[[0,\"                \"],[7,\"div\"],[9],[1,[24,4,[]],false],[0,\": \"],[1,[24,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[3,4]},{\"statements\":[[0,\"                \"],[7,\"div\"],[9],[1,[24,1,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"            \"],[10],[0,\"\\n          \"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[1,2]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[15,14],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/validator-job/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-pipeline/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    isOpen: true,
    actions: {
      nameClick() {
        this.toggleProperty('isOpen');
        this.$('div').toggle('hidden');
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-pipeline/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "ZQNm5eTE",
    "block": "{\"symbols\":[\"value\",\"name\",\"&default\"],\"statements\":[[7,\"h4\"],[11,\"class\",\"pipeline\"],[9],[7,\"i\"],[12,\"class\",[30,[\"fa fa-\",[29,\"if\",[[25,[\"isOpen\"]],\"minus-square\",\"plus-square\"],null]]]],[11,\"aria-hidden\",\"true\"],[9],[10],[0,\" Pipeline Settings\"],[3,\"action\",[[24,0,[]],\"nameClick\"]],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"annotations\"],[11,\"title\",\"These are the pipeline-level annotations that the user has defined.\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[9],[0,\"Annotations:\"],[10],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"value\"],[9],[0,\"\\n    \"],[7,\"ul\"],[9],[0,\"\\n\"],[4,\"each\",[[29,\"-each-in\",[[25,[\"annotations\"]]],null]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[7,\"span\"],[11,\"class\",\"name\"],[9],[1,[24,2,[]],false],[0,\": \"],[10],[7,\"span\"],[11,\"class\",\"value\"],[9],[1,[24,1,[]],false],[10],[10],[0,\"\\n\"]],\"parameters\":[1,2]},{\"statements\":[[0,\"        \"],[7,\"li\"],[9],[0,\"None defined\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"workflow\"],[9],[0,\"\\n  \"],[7,\"span\"],[11,\"class\",\"label\"],[11,\"title\",\"This is the order that the jobs will run in.\"],[9],[0,\"Workflow:\"],[10],[0,\"\\n  \"],[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\"],[[25,[\"workflowGraph\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\"],[15,3],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/validator-pipeline/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-results/component", ["exports", "screwdriver-ui/utils/template"], function (_exports, _template) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    reads,
    map
  } = Ember.computed;
  const {
    getFullName
  } = _template.default;

  var _default = Ember.Component.extend({
    results: null,
    jobs: reads('results.jobs'),
    errors: map('results.errors', e => typeof e === 'string' ? e : e.message),
    workflowGraph: Ember.computed('results.workflowGraph', {
      get() {
        return Ember.getWithDefault(this, 'results.workflowGraph', {
          nodes: [],
          edges: []
        });
      }

    }),
    annotations: Ember.computed('results.annotations', {
      get() {
        return Ember.getWithDefault(this, 'results.annotations', []);
      }

    }),
    templateName: Ember.computed('results.template.{namespace,name,version}', {
      get() {
        // construct full template name
        const fullName = getFullName({
          name: this.get('results.template.name'),
          namespace: this.get('results.template.namespace')
        });
        return "".concat(fullName, "@").concat(Ember.get(this, 'results.template.version'));
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/validator-results/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "AQntHPV6",
    "block": "{\"symbols\":[\"node\",\"jobConfig\",\"index\",\"msg\",\"&default\"],\"statements\":[[4,\"each\",[[25,[\"errors\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"error\"],[9],[1,[24,4,[]],false],[10],[0,\"\\n\"]],\"parameters\":[4]},null],[4,\"if\",[[25,[\"isTemplate\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"validator-job\",null,[[\"name\",\"job\",\"template\"],[[25,[\"templateName\"]],[25,[\"results\",\"template\",\"config\"]],[25,[\"results\",\"template\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[1,[29,\"validator-pipeline\",null,[[\"name\",\"workflowGraph\",\"annotations\"],[[25,[\"pipelineName\"]],[25,[\"workflowGraph\"]],[25,[\"annotations\"]]]]],false],[0,\"\\n\"],[4,\"each\",[[25,[\"workflowGraph\",\"nodes\"]]],null,{\"statements\":[[4,\"if\",[[29,\"get\",[[25,[\"jobs\"]],[24,1,[\"name\"]]],null]],null,{\"statements\":[[4,\"each\",[[29,\"get\",[[25,[\"jobs\"]],[24,1,[\"name\"]]],null]],null,{\"statements\":[[0,\"        \"],[1,[29,\"validator-job\",null,[[\"name\",\"job\",\"index\"],[[24,1,[\"name\"]],[24,2,[]],[24,3,[]]]]],false],[0,\"\\n\"]],\"parameters\":[2,3]},null]],\"parameters\":[]},null]],\"parameters\":[1]},null]],\"parameters\":[]}],[15,5],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/validator-results/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/vertical-collection", ["exports", "@html-next/vertical-collection/components/vertical-collection/component"], function (_exports, _component) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
;define("screwdriver-ui/components/workflow-graph-d3/component", ["exports", "screwdriver-ui/utils/graph-tools"], function (_exports, _graphTools) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    router: Ember.inject.service(),
    classNameBindings: ['minified'],
    displayJobNames: true,
    graph: {
      nodes: [],
      edges: []
    },
    decoratedGraph: Ember.computed('showDownstreamTriggers', 'workflowGraph', 'startFrom', 'minified', 'builds.@each.{status,id}', 'jobs.@each.{isDisabled,state,stateChanger}', 'completeWorkflowGraph', {
      get() {
        const showDownstreamTriggers = Ember.getWithDefault(this, 'showDownstreamTriggers', false);
        const builds = Ember.getWithDefault(this, 'builds', []);
        const {
          startFrom
        } = this;
        const jobs = Ember.getWithDefault(this, 'jobs', []);
        const workflowGraph = Ember.getWithDefault(this, 'workflowGraph', {
          nodes: [],
          edges: []
        });
        const completeGraph = Ember.getWithDefault(this, 'completeWorkflowGraph', workflowGraph);
        let graph = showDownstreamTriggers ? completeGraph : workflowGraph;
        Ember.set(this, 'graph', graph);
        return (0, _graphTools.decorateGraph)({
          inputGraph: this.minified ? (0, _graphTools.subgraphFilter)(graph, startFrom) : graph,
          builds,
          jobs,
          start: startFrom
        });
      }

    }),
    elementSizes: Ember.computed('minified', {
      get() {
        if (this.minified) {
          return {
            ICON_SIZE: 12,
            TITLE_SIZE: 0,
            ARROWHEAD: 2
          };
        }

        return {
          ICON_SIZE: 36,
          TITLE_SIZE: 12,
          ARROWHEAD: 6
        };
      }

    }),

    didInsertElement() {
      this._super(...arguments);

      this.draw(this.decoratedGraph);
      Ember.set(this, 'lastGraph', this.get('graph'));
    },

    // Listen for changes to workflow and update graph accordingly.
    didReceiveAttrs() {
      this._super(...arguments);

      this.doRedraw(this.get('decoratedGraph'));
    },

    doRedraw(decoratedGraph) {
      const lg = this.lastGraph;
      const wg = this.get('graph');

      if (!this.graphNode) {
        return;
      } // redraw anyways when graph changes


      if (lg !== wg) {
        this.graphNode.remove();
        this.draw(decoratedGraph);
        Ember.set(this, 'lastGraph', wg);
      } else {
        this.redraw(decoratedGraph.graph);
      }
    },

    actions: {
      buildClicked(job) {
        const fn = this.graphClicked;

        if (!this.minified && typeof fn === 'function') {
          fn(job, d3.event, this.elementSizes);
        }
      }

    },

    redraw(data) {
      const el = d3.select(this.element);
      data.nodes.forEach(node => {
        const n = el.select("g.graph-node[data-job=\"".concat(node.name, "\"]"));

        if (n) {
          const txt = n.select('text');
          txt.text((0, _graphTools.icon)(node.status));
          n.attr('class', "graph-node".concat(node.status ? " build-".concat(node.status.toLowerCase()) : ''));
        }
      });
    },

    draw(data) {
      const MAX_DISPLAY_NAME = 20;
      const MAX_LENGTH = Math.min(data.nodes.reduce((max, cur) => Math.max(cur.name.length, max), 0), MAX_DISPLAY_NAME);
      const {
        ICON_SIZE,
        TITLE_SIZE,
        ARROWHEAD
      } = this.elementSizes;
      let X_WIDTH = ICON_SIZE * 2; // When displaying job names use estimate of 7 per character

      if (TITLE_SIZE && this.displayJobNames) {
        X_WIDTH = Math.max(X_WIDTH, MAX_LENGTH * 7);
      } // Adjustable spacing between nodes


      const Y_SPACING = ICON_SIZE;
      const EDGE_GAP = Math.floor(ICON_SIZE / 6); // Calculate the canvas size based on amount of content, or override with user-defined size

      const w = this.width || data.meta.width * X_WIDTH;
      const h = this.height || data.meta.height * ICON_SIZE + data.meta.height * Y_SPACING; // Add the SVG element

      const svg = d3.select(this.element).append('svg').attr('width', w).attr('height', h).on('click.graph-node:not', e => {
        this.send('buildClicked', e);
      }, true);
      this.set('graphNode', svg);

      const calcXCenter = pos => X_WIDTH / 2 + pos * X_WIDTH; // Calculate the start/end point of a line


      const calcPos = (pos, spacer) => (pos + 1) * ICON_SIZE + (pos * spacer - ICON_SIZE / 2); // edges


      svg.selectAll('link').data(data.edges).enter().append('path').attr('class', d => "graph-edge ".concat(d.status ? "build-".concat(d.status.toLowerCase()) : '')).attr('stroke-dasharray', d => !d.status ? 5 : 500).attr('stroke-width', 2).attr('fill', 'transparent').attr('d', d => {
        const path = d3.path();
        const startX = calcXCenter(d.from.x) + ICON_SIZE / 2 + EDGE_GAP;
        const startY = calcPos(d.from.y, Y_SPACING);
        const endX = calcXCenter(d.to.x) - ICON_SIZE / 2 - EDGE_GAP;
        const endY = calcPos(d.to.y, Y_SPACING);
        path.moveTo(startX, startY); // curvy line

        path.bezierCurveTo(endX, startY, endX - X_WIDTH / 2, endY, endX, endY); // arrowhead

        path.lineTo(endX - ARROWHEAD, endY - ARROWHEAD);
        path.moveTo(endX, endY);
        path.lineTo(endX - ARROWHEAD, endY + ARROWHEAD);
        return path;
      }); // Jobs Icons

      svg.selectAll('jobs').data(data.nodes).enter() // for each element in data array - do the following
      // create a group element to animate
      .append('g').attr('class', d => "graph-node".concat(d.status ? " build-".concat(d.status.toLowerCase()) : '')).attr('data-job', d => d.name) // create the icon graphic
      .insert('text').text(d => (0, _graphTools.icon)(d.status)).attr('font-size', "".concat(ICON_SIZE, "px")).style('text-anchor', 'middle').attr('x', d => calcXCenter(d.pos.x)).attr('y', d => (d.pos.y + 1) * ICON_SIZE + d.pos.y * Y_SPACING).on('click', e => {
        this.send('buildClicked', e);
      }) // add a tooltip
      .insert('title').text(d => d.status ? "".concat(d.name, " - ").concat(d.status) : d.name); // Job Names

      if (TITLE_SIZE && this.displayJobNames) {
        svg.selectAll('jobslabels').data(data.nodes).enter().append('text').text(d => d.name.length >= MAX_DISPLAY_NAME ? "".concat(d.name.substr(0, 8), "...").concat(d.name.substr(-8)) : d.name).attr('class', 'graph-label').attr('font-size', "".concat(TITLE_SIZE, "px")).style('text-anchor', 'middle').attr('x', d => calcXCenter(d.pos.x)).attr('y', d => (d.pos.y + 1) * ICON_SIZE + d.pos.y * Y_SPACING + TITLE_SIZE).insert('title').text(d => d.name);
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/workflow-graph-d3/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "eN/+LEt7",
    "block": "{\"symbols\":[\"&default\"],\"statements\":[[15,1]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/workflow-graph-d3/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/workflow-tooltip/component", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Component.extend({
    classNames: 'workflow-tooltip',
    classNameBindings: ['showTooltip', 'left'],
    showTooltip: false,
    left: Ember.computed.equal('showTooltipPosition', 'left'),

    didUpdateAttrs() {
      this._super(...arguments);

      const event = Ember.get(this, 'tooltipData.mouseevent');
      const el = this.$(); // setting tooltip position

      if (el && event) {
        let top = event.layerY + Ember.get(this, 'tooltipData.sizes.ICON_SIZE');
        let left = this.left ? event.layerX - 20 : event.layerX - el.outerWidth() / 2;
        el.css({
          top,
          left
        });
      }
    },

    actions: {
      stopBuild() {
        this.stopBuild(Ember.get(this, 'tooltipData.job'));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/workflow-tooltip/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "B/4tOP6t",
    "block": "{\"symbols\":[\"t\",\"&default\"],\"statements\":[[7,\"div\"],[11,\"class\",\"content\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"tooltipData\",\"externalTrigger\"]]],null,{\"statements\":[[0,\"    \"],[4,\"link-to\",[\"pipeline\",[25,[\"tooltipData\",\"externalTrigger\",\"pipelineId\"]]],null,{\"statements\":[[0,\"Go to remote pipeline\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"tooltipData\",\"triggers\"]]],null,{\"statements\":[[4,\"each\",[[25,[\"tooltipData\",\"triggers\"]]],null,{\"statements\":[[0,\"      \"],[4,\"link-to\",[\"pipeline\",[24,1,[\"pipelineId\"]]],null,{\"statements\":[[0,\"Go to downstream pipeline \"],[1,[24,1,[\"triggerName\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[1]},null]],\"parameters\":[]},{\"statements\":[[4,\"if\",[[25,[\"tooltipData\",\"job\",\"buildId\"]]],null,{\"statements\":[[0,\"      \"],[4,\"link-to\",[\"pipeline.build\",[25,[\"tooltipData\",\"job\",\"buildId\"]]],null,{\"statements\":[[0,\"Go to build details\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"    \"],[4,\"link-to\",[\"pipeline.metrics\",[29,\"query-params\",null,[[\"jobId\"],[[25,[\"tooltipData\",\"job\",\"id\"]]]]]],null,{\"statements\":[[0,\"Go to build metrics\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[25,[\"displayRestartButton\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[25,[\"tooltipData\",\"job\",\"status\"]],\"DISABLED\"],null]],null,{\"statements\":[[0,\"        \"],[7,\"p\"],[9],[1,[25,[\"tooltipData\",\"job\",\"stateChangeMessage\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        \"],[7,\"a\"],[9],[0,\"Start pipeline from here\"],[3,\"action\",[[24,0,[]],[25,[\"confirmStartBuild\"]]]],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},null],[4,\"if\",[[25,[\"tooltipData\",\"displayStop\"]]],null,{\"statements\":[[0,\"      \"],[7,\"a\"],[9],[0,\"Stop build\"],[3,\"action\",[[24,0,[]],[25,[\"stopBuild\"]],[25,[\"tooltipData\",\"job\"]]]],[10],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"  \"]],\"parameters\":[]}]],\"parameters\":[]}],[0,\"  \"],[15,2],[0,\"\\n\"],[10]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/components/workflow-tooltip/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/components/x-toggle-label", ["exports", "ember-toggle/components/x-toggle-label/component"], function (_exports, _component) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
;define("screwdriver-ui/components/x-toggle-switch", ["exports", "ember-toggle/components/x-toggle-switch/component"], function (_exports, _component) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _component.default;
    }
  });
});
;define("screwdriver-ui/components/x-toggle", ["exports", "ember-toggle/components/x-toggle/component", "screwdriver-ui/config/environment"], function (_exports, _component, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const config = _environment.default['ember-toggle'] || {};

  var _default = _component.default.extend({
    /* eslint-disable ember/avoid-leaking-state-in-ember-objects */
    theme: config.defaultTheme || 'default',
    defaultOffLabel: config.defaultOffLabel || 'Off::off',
    defaultOnLabel: config.defaultOnLabel || 'On::on',
    showLabels: config.defaultShowLabels || false,
    size: config.defaultSize || 'medium'
  });

  _exports.default = _default;
});
;define("screwdriver-ui/coverage/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    /**
     * @param {Object} config
     * @param {Number} config.buildId     Build ID
     * @param {Number} config.jobId       Job ID
     * @param {String} config.startTime   Start time of the coverage step
     * @param {String} config.endTime     End time of the coverage step
     */
    getCoverageInfo(config) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/coverage/info");
      const ajaxConfig = {
        method: 'GET',
        url,
        data: config,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise(resolve => {
        // Call the token api to get the session info
        _jquery.default.ajax(ajaxConfig).done(content => resolve({
          coverage: content.coverage !== 'N/A' ? "".concat(content.coverage, "%") : 'N/A',
          coverageUrl: content.coverage !== 'N/A' ? content.projectUrl : '#',
          tests: content.tests,
          testsUrl: content.tests !== 'N/A' ? content.projectUrl : '#'
        })).fail(() => resolve({
          coverage: 'N/A',
          coverageUrl: '#',
          tests: 'N/A',
          testsUrl: '#'
        }));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/create/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    isSaving: false,
    errorMessage: '',
    actions: {
      createPipeline({
        scmUrl,
        rootDir
      }) {
        let payload = {
          checkoutUrl: scmUrl,
          rootDir
        };
        let pipeline = this.store.createRecord('pipeline', payload);
        this.set('isSaving', true);
        pipeline.save().then(() => {
          this.transitionToRoute('pipeline', pipeline.get('id'));
        }, err => {
          let error = err.errors[0] || {};

          if (error.status === 409 && typeof error.data === 'object' && error.data.existingId) {
            this.transitionToRoute('pipeline', error.data.existingId);
          } else {
            this.set('errorMessage', error.detail);
          }
        }).finally(() => {
          this.set('isSaving', false);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/create/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    titleToken: 'Create Pipeline',
    routeAfterAuthentication: 'create'
  });

  _exports.default = _default;
});
;define("screwdriver-ui/create/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "kk5JixvG",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-create-form\",null,[[\"isSaving\",\"errorMessage\",\"onCreatePipeline\"],[[25,[\"isSaving\"]],[25,[\"errorMessage\"]],[29,\"action\",[[24,0,[]],\"createPipeline\"],null]]]],false],[0,\"\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/create/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/dashboard/index/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    titleToken: 'Dashboard',
    routeAfterAuthentication: 'home',

    activate() {
      if (!Ember.get(this, 'session.isAuthenticated') || Ember.get(this, 'session.data.authenticated.isGuest')) {
        this.replaceWith('home');
      }

      return this.store.findAll('collection').then(collections => {
        if (Ember.get(collections, 'length')) {
          // Get the id of the last object in this array. The last
          // object will be the first collection created by the user.
          const routeId = Ember.get(collections, 'lastObject.id');
          this.replaceWith("/dashboards/".concat(routeId));
        } else {
          this.replaceWith('home');
        }
      }).catch(() => {
        this.replaceWith('home');
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/dashboard/index/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "Tow5EpDo",
    "block": "{\"symbols\":[],\"statements\":[[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/dashboard/index/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/dashboard/show/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    collection: Ember.computed.alias('model'),
    editingDescription: false,
    editingName: false,
    actions: {
      removePipeline(pipelineId, collectionId) {
        return this.store.findRecord('collection', collectionId).then(collection => {
          const pipelineIds = Ember.getWithDefault(collection, 'pipelineIds', []);
          Ember.set(collection, 'pipelineIds', pipelineIds.filter(id => id !== pipelineId));
          return collection.save();
        });
      },

      onDeleteCollection() {
        this.transitionToRoute('home');
      },

      changeCollection() {
        this.set('editingDescription', false);
        this.set('editingName', false);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/dashboard/show/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model(params) {
      return this.store.findRecord('collection', params.collection_id);
    },

    actions: {
      error() {
        return this.transitionTo('/404');
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/dashboard/show/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "1G+G6xET",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[1,[29,\"collections-flyout\",null,[[\"class\",\"onDeleteCollection\",\"selectedCollectionId\",\"editingDescription\",\"changeCollection\"],[\"col-md-3\",[29,\"action\",[[24,0,[]],\"onDeleteCollection\"],null],[25,[\"collection\",\"id\"]],[25,[\"editingDescription\"]],[29,\"action\",[[24,0,[]],\"changeCollection\"],null]]]],false],[0,\"\\n  \"],[1,[29,\"collection-view\",null,[[\"onPipelineRemove\",\"collection\",\"class\",\"editingDescription\",\"editingName\"],[[29,\"action\",[[24,0,[]],\"removePipeline\"],null],[25,[\"collection\"]],\"col-md-9\",[25,[\"editingDescription\"]],[25,[\"editingName\"]]]]],false],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/dashboard/show/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/pan", ["exports", "ember-gestures/recognizers/pan"], function (_exports, _pan) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _pan.default;
  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/pinch", ["exports", "ember-gestures/recognizers/pinch"], function (_exports, _pinch) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _pinch.default;
  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/press", ["exports", "ember-gestures/recognizers/press"], function (_exports, _press) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _press.default;
  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/rotate", ["exports", "ember-gestures/recognizers/rotate"], function (_exports, _rotate) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _rotate.default;
  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/swipe", ["exports", "ember-gestures/recognizers/swipe"], function (_exports, _swipe) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _swipe.default;
  _exports.default = _default;
});
;define("screwdriver-ui/ember-gestures/recognizers/tap", ["exports", "ember-gestures/recognizers/tap"], function (_exports, _tap) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _tap.default;
    }
  });
});
;define("screwdriver-ui/ember-gestures/recognizers/vertical-pan", ["exports", "ember-gestures/recognizers/vertical-pan"], function (_exports, _verticalPan) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _verticalPan.default;
    }
  });
});
;define("screwdriver-ui/ember-gestures/recognizers/vertical-swipe", ["exports", "ember-gestures/recognizers/vertical-swipe"], function (_exports, _verticalSwipe) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _verticalSwipe.default;
    }
  });
});
;define("screwdriver-ui/event-stop/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    /**
     * Stop all running builds or builds about to run in a single event
     * @method stopBuilds
     * @param   {Number}  eventId    ID of event
     * @return  {Promise}            Resolve nothing if success otherwise reject with error message
     */
    stopBuilds(eventId) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/events/").concat(eventId, "/stop");
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url,
          type: 'PUT',
          headers: {
            Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
          }
        }).done(() => resolve()).fail(jqXHR => reject(JSON.parse(jqXHR.responseText).message));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/event/model", ["exports", "ember-data", "screwdriver-ui/config/environment", "screwdriver-ui/mixins/model-reloader", "screwdriver-ui/utils/build"], function (_exports, _emberData, _environment, _modelReloader, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend(_modelReloader.default, {
    buildId: _emberData.default.attr('number'),
    causeMessage: _emberData.default.attr('string'),
    commit: _emberData.default.attr(),
    createTime: _emberData.default.attr('date'),
    creator: _emberData.default.attr(),
    isComplete: _emberData.default.attr('boolean', {
      defaultValue: false
    }),
    meta: _emberData.default.attr(),
    numBuilds: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    reloadWithoutNewBuilds: _emberData.default.attr('number', {
      defaultValue: 0
    }),
    parentBuildId: _emberData.default.attr('number'),
    parentEventId: _emberData.default.attr('number'),
    pipelineId: _emberData.default.attr('string'),
    pr: _emberData.default.attr(),
    prNum: _emberData.default.attr('number'),
    sha: _emberData.default.attr('string'),
    startFrom: _emberData.default.attr('string'),
    status: _emberData.default.attr('string', {
      defaultValue: 'UNKNOWN'
    }),
    type: _emberData.default.attr('string'),
    workflow: _emberData.default.attr(),
    workflowGraph: _emberData.default.attr(),
    builds: _emberData.default.hasMany('build'),
    isRunning: Ember.computed.not('isComplete'),
    buildsSorted: Ember.computed.sort('builds', (a, b) => parseInt(a.id, 10) - parseInt(b.id, 10)),
    createTimeWords: Ember.computed('createTime', 'duration', {
      get() {
        if (Ember.get(this, 'createTime')) {
          const duration = Date.now() - Ember.get(this, 'createTime').getTime();
          return "".concat(humanizeDuration(duration, {
            round: true,
            largest: 1
          }), " ago");
        }

        return '0 seconds ago';
      }

    }),
    duration: Ember.computed('builds.[]', 'isComplete', {
      get() {
        const builds = Ember.get(this, 'builds');
        const firstCreateTime = builds.map(item => Ember.get(item, 'createTime')).sort()[0];
        let lastEndTime = new Date();

        if (Ember.get(this, 'isComplete')) {
          lastEndTime = builds.map(item => Ember.get(item, 'endTime')).sort().pop();
        }

        if (!firstCreateTime || !lastEndTime) {
          return 0;
        }

        return lastEndTime.getTime() - firstCreateTime.getTime();
      }

    }),
    durationText: Ember.computed('duration', {
      get() {
        return humanizeDuration(Ember.get(this, 'duration'), {
          round: true,
          largest: 1
        });
      }

    }),
    label: Ember.computed('meta', {
      get() {
        return this.get('meta.label') || null;
      }

    }),
    truncatedMessage: Ember.computed('commit.message', {
      get() {
        const msg = this.get('commit.message');
        const cutOff = 150;
        return msg.length > cutOff ? "".concat(msg.substring(0, cutOff), "...") : msg;
      }

    }),
    truncatedSha: Ember.computed('sha', {
      get() {
        return this.sha.substr(0, 7);
      }

    }),
    // eslint-disable-next-line ember/no-observers
    statusObserver: Ember.observer('builds.@each.status', 'isComplete', function statusObserver() {
      if (this.isSaving) {
        return;
      }

      const builds = Ember.get(this, 'builds');
      let status = 'UNKNOWN';
      builds.then(list => {
        if (!this.isDestroying && !this.isDestroyed) {
          const validList = list.filter(b => Ember.get(b, 'status') !== 'SUCCESS');

          if (validList.length) {
            status = Ember.get(validList[0], 'status');
          } else {
            status = Ember.get(this, 'isComplete') ? 'SUCCESS' : 'RUNNING';
          }

          Ember.set(this, 'status', status);
        }
      });
    }),
    // eslint-disable-next-line ember/no-observers
    isCompleteObserver: Ember.observer('builds.@each.{status,endTime}', function isCompleteObserver() {
      if (this.isSaving) {
        return;
      }

      const builds = Ember.get(this, 'builds');
      builds.then(list => {
        if (this.isDestroying || this.isDestroyed) {
          return false;
        } // Tell model to reload builds.


        this.startReloading();
        Ember.set(this, 'reload', Ember.get(this, 'reload') + 1);
        const numBuilds = Ember.get(list, 'length'); // no builds yet

        if (!numBuilds) {
          Ember.set(this, 'isComplete', false);
          return false;
        } // See if any builds are running


        const runningBuild = list.find(b => {
          const status = Ember.get(b, 'status');
          const endTime = Ember.get(b, 'endTime');
          return (0, _build.isActiveBuild)(status, endTime);
        }); // Something is running, so we aren't done

        if (runningBuild) {
          Ember.set(this, 'isComplete', false);
          Ember.set(this, 'numBuilds', numBuilds);
          Ember.set(this, 'reloadWithoutNewBuilds', 0);
          return false;
        } // Nothing is running now, check if new builds added during reload
        // If get(this, 'numBuilds') === 0 that means it is the first load not a reload


        const newBuilds = Ember.get(this, 'numBuilds') === 0 ? 0 : numBuilds - Ember.get(this, 'numBuilds'); // New builds created during reload, event is still going, reset everything

        if (newBuilds > 0) {
          Ember.set(this, 'isComplete', false);
          Ember.set(this, 'numBuilds', numBuilds);
          Ember.set(this, 'reloadWithoutNewBuilds', 0);
          return false;
        }

        const reloadWithoutNewBuilds = Ember.get(this, 'reloadWithoutNewBuilds') + 1; // If reloads 2 times without new builds added, consider event as complete

        if (reloadWithoutNewBuilds >= 2) {
          Ember.set(this, 'isComplete', true);
          Ember.set(this, 'reloadWithoutNewBuilds', reloadWithoutNewBuilds);
          return true;
        } // No new builds added so far, keep counting the reload


        Ember.set(this, 'numBuilds', numBuilds);
        Ember.set(this, 'reloadWithoutNewBuilds', reloadWithoutNewBuilds);
        Ember.set(this, 'isComplete', false);
        return false;
      });
    }),
    modelToReload: 'builds',
    reloadTimeout: _environment.default.APP.EVENT_RELOAD_TIMER,

    // Reload builds only if the event is still running
    shouldReload() {
      return Ember.get(this, 'isRunning');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/event/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    normalizeResponse(store, typeClass, payload, id, requestType) {
      if (payload.events) {
        payload.events.forEach(event => {
          if (event.workflowGraph) {
            // sorting on the dest should be enough
            event.workflowGraph.edges = event.workflowGraph.edges.sort(({
              dest: a
            }, {
              dest: b
            }) => {
              if (a < b) {
                return -1;
              }

              if (a > b) {
                return 1;
              }

              return 0;
            });
          }
        });
      }

      return this._super(store, typeClass, payload, id, requestType);
    },

    /**
     * Override the serializeIntoHash method to handle model names without a root key
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      const data = {
        pipelineId: snapshot.attr('pipelineId'),
        startFrom: snapshot.attr('startFrom'),
        prNum: snapshot.attr('prNum')
      };

      if (snapshot.attr('causeMessage')) {
        data.causeMessage = snapshot.attr('causeMessage');
      }

      if (snapshot.attr('parentBuildId')) {
        data.parentBuildId = parseInt(snapshot.attr('parentBuildId'), 10);
      }

      if (snapshot.attr('parentEventId')) {
        data.parentEventId = parseInt(snapshot.attr('parentEventId'), 10);
      }

      if (snapshot.attr('buildId')) {
        data.buildId = parseInt(snapshot.attr('buildId'), 10);
      }

      return Ember.assign(hash, data);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/event_dispatcher", ["exports", "ember-gestures/event_dispatcher", "screwdriver-ui/config/environment"], function (_exports, _event_dispatcher, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const assign = Ember.assign || Ember.merge;
  let gestures = assign({}, {
    emberUseCapture: false,
    removeTracking: false,
    useFastPaths: false
  });
  gestures = assign(gestures, _environment.default.gestures);

  var _default = _event_dispatcher.default.extend({
    useCapture: gestures.emberUseCapture,
    removeTracking: gestures.removeTracking,
    useFastPaths: gestures.useFastPaths
  });

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/and", ["exports", "ember-truth-helpers/helpers/and"], function (_exports, _and) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _and.default;
    }
  });
  Object.defineProperty(_exports, "and", {
    enumerable: true,
    get: function () {
      return _and.and;
    }
  });
});
;define("screwdriver-ui/helpers/ansi-colorize", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.ansiColorize = ansiColorize;
  _exports.default = void 0;
  const ansiUp = new AnsiUp(); // Prevent double-encoding

  ansiUp.escape_for_html = false;
  ansiUp.use_classes = true;
  /**
   * Transform ansi color codes to html tags
   * @method ansiColorize
   * @param  {Array}     params   Values passed to helper
   * @return {String}             Html string
   */

  function ansiColorize([message]) {
    // encode html content
    const m = Ember.Handlebars.Utils.escapeExpression(message);
    return Ember.String.htmlSafe(ansiUp.ansi_to_html(m));
  }

  var _default = Ember.Helper.helper(ansiColorize);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/app-version", ["exports", "screwdriver-ui/config/environment", "ember-cli-app-version/utils/regexp"], function (_exports, _environment, _regexp) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.appVersion = appVersion;
  _exports.default = void 0;

  function appVersion(_, hash = {}) {
    const version = _environment.default.APP.version; // e.g. 1.0.0-alpha.1+4jds75hf
    // Allow use of 'hideSha' and 'hideVersion' For backwards compatibility

    let versionOnly = hash.versionOnly || hash.hideSha;
    let shaOnly = hash.shaOnly || hash.hideVersion;
    let match = null;

    if (versionOnly) {
      if (hash.showExtended) {
        match = version.match(_regexp.versionExtendedRegExp); // 1.0.0-alpha.1
      } // Fallback to just version


      if (!match) {
        match = version.match(_regexp.versionRegExp); // 1.0.0
      }
    }

    if (shaOnly) {
      match = version.match(_regexp.shaRegExp); // 4jds75hf
    }

    return match ? match[0] : version;
  }

  var _default = Ember.Helper.helper(appVersion);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/append", ["exports", "ember-composable-helpers/helpers/append"], function (_exports, _append) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _append.default;
    }
  });
  Object.defineProperty(_exports, "append", {
    enumerable: true,
    get: function () {
      return _append.append;
    }
  });
});
;define("screwdriver-ui/helpers/array", ["exports", "ember-composable-helpers/helpers/array"], function (_exports, _array) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _array.default;
    }
  });
  Object.defineProperty(_exports, "array", {
    enumerable: true,
    get: function () {
      return _array.array;
    }
  });
});
;define("screwdriver-ui/helpers/await", ["exports", "ember-promise-helpers/helpers/await"], function (_exports, _await) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _await.default;
    }
  });
});
;define("screwdriver-ui/helpers/bs-contains", ["exports", "ember-bootstrap/helpers/bs-contains"], function (_exports, _bsContains) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsContains.default;
    }
  });
  Object.defineProperty(_exports, "bsContains", {
    enumerable: true,
    get: function () {
      return _bsContains.bsContains;
    }
  });
});
;define("screwdriver-ui/helpers/bs-eq", ["exports", "ember-bootstrap/helpers/bs-eq"], function (_exports, _bsEq) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _bsEq.default;
    }
  });
  Object.defineProperty(_exports, "eq", {
    enumerable: true,
    get: function () {
      return _bsEq.eq;
    }
  });
});
;define("screwdriver-ui/helpers/camelize", ["exports", "ember-cli-string-helpers/helpers/camelize"], function (_exports, _camelize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _camelize.default;
    }
  });
  Object.defineProperty(_exports, "camelize", {
    enumerable: true,
    get: function () {
      return _camelize.camelize;
    }
  });
});
;define("screwdriver-ui/helpers/cancel-all", ["exports", "ember-concurrency/helpers/cancel-all"], function (_exports, _cancelAll) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _cancelAll.default;
    }
  });
});
;define("screwdriver-ui/helpers/capitalize", ["exports", "ember-cli-string-helpers/helpers/capitalize"], function (_exports, _capitalize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _capitalize.default;
    }
  });
  Object.defineProperty(_exports, "capitalize", {
    enumerable: true,
    get: function () {
      return _capitalize.capitalize;
    }
  });
});
;define("screwdriver-ui/helpers/chunk", ["exports", "ember-composable-helpers/helpers/chunk"], function (_exports, _chunk) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _chunk.default;
    }
  });
  Object.defineProperty(_exports, "chunk", {
    enumerable: true,
    get: function () {
      return _chunk.chunk;
    }
  });
});
;define("screwdriver-ui/helpers/classify", ["exports", "ember-cli-string-helpers/helpers/classify"], function (_exports, _classify) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _classify.default;
    }
  });
  Object.defineProperty(_exports, "classify", {
    enumerable: true,
    get: function () {
      return _classify.classify;
    }
  });
});
;define("screwdriver-ui/helpers/compact", ["exports", "ember-composable-helpers/helpers/compact"], function (_exports, _compact) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _compact.default;
    }
  });
});
;define("screwdriver-ui/helpers/compute", ["exports", "ember-composable-helpers/helpers/compute"], function (_exports, _compute) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _compute.default;
    }
  });
  Object.defineProperty(_exports, "compute", {
    enumerable: true,
    get: function () {
      return _compute.compute;
    }
  });
});
;define("screwdriver-ui/helpers/contains", ["exports", "ember-composable-helpers/helpers/contains"], function (_exports, _contains) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _contains.default;
    }
  });
  Object.defineProperty(_exports, "contains", {
    enumerable: true,
    get: function () {
      return _contains.contains;
    }
  });
});
;define("screwdriver-ui/helpers/dasherize", ["exports", "ember-cli-string-helpers/helpers/dasherize"], function (_exports, _dasherize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _dasherize.default;
    }
  });
  Object.defineProperty(_exports, "dasherize", {
    enumerable: true,
    get: function () {
      return _dasherize.dasherize;
    }
  });
});
;define("screwdriver-ui/helpers/dec", ["exports", "ember-composable-helpers/helpers/dec"], function (_exports, _dec) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _dec.default;
    }
  });
  Object.defineProperty(_exports, "dec", {
    enumerable: true,
    get: function () {
      return _dec.dec;
    }
  });
});
;define("screwdriver-ui/helpers/drop", ["exports", "ember-composable-helpers/helpers/drop"], function (_exports, _drop) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _drop.default;
    }
  });
});
;define("screwdriver-ui/helpers/eq", ["exports", "ember-truth-helpers/helpers/equal"], function (_exports, _equal) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _equal.default;
    }
  });
  Object.defineProperty(_exports, "equal", {
    enumerable: true,
    get: function () {
      return _equal.equal;
    }
  });
});
;define("screwdriver-ui/helpers/filter-by", ["exports", "ember-composable-helpers/helpers/filter-by"], function (_exports, _filterBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _filterBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/filter", ["exports", "ember-composable-helpers/helpers/filter"], function (_exports, _filter) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _filter.default;
    }
  });
});
;define("screwdriver-ui/helpers/find-by", ["exports", "ember-composable-helpers/helpers/find-by"], function (_exports, _findBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _findBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/flatten", ["exports", "ember-composable-helpers/helpers/flatten"], function (_exports, _flatten) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _flatten.default;
    }
  });
  Object.defineProperty(_exports, "flatten", {
    enumerable: true,
    get: function () {
      return _flatten.flatten;
    }
  });
});
;define("screwdriver-ui/helpers/get-last-build", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.getLastBuild = getLastBuild;
  _exports.default = void 0;

  /**
   * Get first build from an array of builds.
   * @method getLastBuild
   * @param  {Array}     params        An array of arguments
   * @return {Object}    last build
   */
  function getLastBuild(params) {
    const builds = params[0];

    if (builds.length < 1) {
      return '';
    }

    return builds.objectAt(0);
  }

  var _default = Ember.Helper.helper(getLastBuild);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/get-step-data", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.getStepData = getStepData;
  _exports.default = void 0;

  /**
   * Get the step data for a given step name and build
   * @method getStepData
   * @param  {Array}    buildSteps  The build model
   * @param  {String}    step   The step name
   * @param  {String}    field  The step field name
   * @return {Any|undefined}
   */
  function getStepData([buildSteps, step, field]) {
    let data;

    if (!step) {
      return data;
    }

    data = buildSteps.find(s => s.name === step);

    if (field) {
      return Ember.get(data, field);
    }

    return data;
  }

  var _default = Ember.Helper.helper(getStepData);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/group-by", ["exports", "ember-composable-helpers/helpers/group-by"], function (_exports, _groupBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _groupBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/gt", ["exports", "ember-truth-helpers/helpers/gt"], function (_exports, _gt) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _gt.default;
    }
  });
  Object.defineProperty(_exports, "gt", {
    enumerable: true,
    get: function () {
      return _gt.gt;
    }
  });
});
;define("screwdriver-ui/helpers/gte", ["exports", "ember-truth-helpers/helpers/gte"], function (_exports, _gte) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _gte.default;
    }
  });
  Object.defineProperty(_exports, "gte", {
    enumerable: true,
    get: function () {
      return _gte.gte;
    }
  });
});
;define("screwdriver-ui/helpers/has-next", ["exports", "ember-composable-helpers/helpers/has-next"], function (_exports, _hasNext) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _hasNext.default;
    }
  });
  Object.defineProperty(_exports, "hasNext", {
    enumerable: true,
    get: function () {
      return _hasNext.hasNext;
    }
  });
});
;define("screwdriver-ui/helpers/has-previous", ["exports", "ember-composable-helpers/helpers/has-previous"], function (_exports, _hasPrevious) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _hasPrevious.default;
    }
  });
  Object.defineProperty(_exports, "hasPrevious", {
    enumerable: true,
    get: function () {
      return _hasPrevious.hasPrevious;
    }
  });
});
;define("screwdriver-ui/helpers/html-safe", ["exports", "ember-cli-string-helpers/helpers/html-safe"], function (_exports, _htmlSafe) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _htmlSafe.default;
    }
  });
  Object.defineProperty(_exports, "htmlSafe", {
    enumerable: true,
    get: function () {
      return _htmlSafe.htmlSafe;
    }
  });
});
;define("screwdriver-ui/helpers/humanize", ["exports", "ember-cli-string-helpers/helpers/humanize"], function (_exports, _humanize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _humanize.default;
    }
  });
  Object.defineProperty(_exports, "humanize", {
    enumerable: true,
    get: function () {
      return _humanize.humanize;
    }
  });
});
;define("screwdriver-ui/helpers/ignore-children", ["exports", "ember-ignore-children-helper/helpers/ignore-children"], function (_exports, _ignoreChildren) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ignoreChildren.default;
    }
  });
  Object.defineProperty(_exports, "ignoreChildren", {
    enumerable: true,
    get: function () {
      return _ignoreChildren.ignoreChildren;
    }
  });
});
;define("screwdriver-ui/helpers/inc", ["exports", "ember-composable-helpers/helpers/inc"], function (_exports, _inc) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _inc.default;
    }
  });
  Object.defineProperty(_exports, "inc", {
    enumerable: true,
    get: function () {
      return _inc.inc;
    }
  });
});
;define("screwdriver-ui/helpers/index-of", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.indexOf = indexOf;
  _exports.default = void 0;

  /**
   * get an element of the array at the specified index
   * @method indexOf
   * @param  {Array} params   [contextArr, index]
   * @return {Mixed}
   */
  function indexOf(params) {
    if (Array.isArray(params[0])) {
      return params[0][params[1]];
    }

    return params[0].objectAt(params[1]);
  }

  var _default = Ember.Helper.helper(indexOf);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/inline-svg", ["exports", "ember-inline-svg/helpers/inline-svg", "screwdriver-ui/svgs"], function (_exports, _inlineSvg, _svgs) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  let helper;

  if (Ember.Helper && Ember.Helper.helper) {
    helper = Ember.Helper.helper(function ([path], options) {
      return (0, _inlineSvg.inlineSvg)(_svgs.default, path, options);
    });
  } else {
    helper = Ember.Handlebars.makeBoundHelper(function (path, options) {
      return (0, _inlineSvg.inlineSvg)(_svgs.default, path, options.hash || {});
    });
  }

  var _default = helper;
  _exports.default = _default;
});
;define("screwdriver-ui/helpers/intersect", ["exports", "ember-composable-helpers/helpers/intersect"], function (_exports, _intersect) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _intersect.default;
    }
  });
});
;define("screwdriver-ui/helpers/invoke", ["exports", "ember-composable-helpers/helpers/invoke"], function (_exports, _invoke) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _invoke.default;
    }
  });
  Object.defineProperty(_exports, "invoke", {
    enumerable: true,
    get: function () {
      return _invoke.invoke;
    }
  });
});
;define("screwdriver-ui/helpers/is-after", ["exports", "ember-moment/helpers/is-after"], function (_exports, _isAfter) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isAfter.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-array", ["exports", "ember-truth-helpers/helpers/is-array"], function (_exports, _isArray) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isArray.default;
    }
  });
  Object.defineProperty(_exports, "isArray", {
    enumerable: true,
    get: function () {
      return _isArray.isArray;
    }
  });
});
;define("screwdriver-ui/helpers/is-before", ["exports", "ember-moment/helpers/is-before"], function (_exports, _isBefore) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isBefore.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-between", ["exports", "ember-moment/helpers/is-between"], function (_exports, _isBetween) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isBetween.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-empty", ["exports", "ember-truth-helpers/helpers/is-empty"], function (_exports, _isEmpty) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isEmpty.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-equal", ["exports", "ember-truth-helpers/helpers/is-equal"], function (_exports, _isEqual) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isEqual.default;
    }
  });
  Object.defineProperty(_exports, "isEqual", {
    enumerable: true,
    get: function () {
      return _isEqual.isEqual;
    }
  });
});
;define("screwdriver-ui/helpers/is-fulfilled", ["exports", "ember-promise-helpers/helpers/is-fulfilled"], function (_exports, _isFulfilled) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isFulfilled.default;
    }
  });
  Object.defineProperty(_exports, "isFulfilled", {
    enumerable: true,
    get: function () {
      return _isFulfilled.isFulfilled;
    }
  });
});
;define("screwdriver-ui/helpers/is-pending", ["exports", "ember-promise-helpers/helpers/is-pending"], function (_exports, _isPending) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isPending.default;
    }
  });
  Object.defineProperty(_exports, "isPending", {
    enumerable: true,
    get: function () {
      return _isPending.isPending;
    }
  });
});
;define("screwdriver-ui/helpers/is-rejected", ["exports", "ember-promise-helpers/helpers/is-rejected"], function (_exports, _isRejected) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isRejected.default;
    }
  });
  Object.defineProperty(_exports, "isRejected", {
    enumerable: true,
    get: function () {
      return _isRejected.isRejected;
    }
  });
});
;define("screwdriver-ui/helpers/is-same-or-after", ["exports", "ember-moment/helpers/is-same-or-after"], function (_exports, _isSameOrAfter) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isSameOrAfter.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-same-or-before", ["exports", "ember-moment/helpers/is-same-or-before"], function (_exports, _isSameOrBefore) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isSameOrBefore.default;
    }
  });
});
;define("screwdriver-ui/helpers/is-same", ["exports", "ember-moment/helpers/is-same"], function (_exports, _isSame) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _isSame.default;
    }
  });
});
;define("screwdriver-ui/helpers/join", ["exports", "ember-composable-helpers/helpers/join"], function (_exports, _join) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _join.default;
    }
  });
});
;define("screwdriver-ui/helpers/lowercase", ["exports", "ember-cli-string-helpers/helpers/lowercase"], function (_exports, _lowercase) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _lowercase.default;
    }
  });
  Object.defineProperty(_exports, "lowercase", {
    enumerable: true,
    get: function () {
      return _lowercase.lowercase;
    }
  });
});
;define("screwdriver-ui/helpers/lt", ["exports", "ember-truth-helpers/helpers/lt"], function (_exports, _lt) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _lt.default;
    }
  });
  Object.defineProperty(_exports, "lt", {
    enumerable: true,
    get: function () {
      return _lt.lt;
    }
  });
});
;define("screwdriver-ui/helpers/lte", ["exports", "ember-truth-helpers/helpers/lte"], function (_exports, _lte) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _lte.default;
    }
  });
  Object.defineProperty(_exports, "lte", {
    enumerable: true,
    get: function () {
      return _lte.lte;
    }
  });
});
;define("screwdriver-ui/helpers/map-by", ["exports", "ember-composable-helpers/helpers/map-by"], function (_exports, _mapBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _mapBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/map", ["exports", "ember-composable-helpers/helpers/map"], function (_exports, _map) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _map.default;
    }
  });
});
;define("screwdriver-ui/helpers/media", ["exports", "ember-responsive/helpers/media"], function (_exports, _media) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _media.default;
    }
  });
  Object.defineProperty(_exports, "media", {
    enumerable: true,
    get: function () {
      return _media.media;
    }
  });
});
;define("screwdriver-ui/helpers/moment-add", ["exports", "ember-moment/helpers/moment-add"], function (_exports, _momentAdd) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentAdd.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-calendar", ["exports", "ember-moment/helpers/moment-calendar"], function (_exports, _momentCalendar) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentCalendar.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-diff", ["exports", "ember-moment/helpers/moment-diff"], function (_exports, _momentDiff) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentDiff.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-duration", ["exports", "ember-moment/helpers/moment-duration"], function (_exports, _momentDuration) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentDuration.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-format", ["exports", "ember-moment/helpers/moment-format"], function (_exports, _momentFormat) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentFormat.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-from-now", ["exports", "ember-moment/helpers/moment-from-now"], function (_exports, _momentFromNow) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentFromNow.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-from", ["exports", "ember-moment/helpers/moment-from"], function (_exports, _momentFrom) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentFrom.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-subtract", ["exports", "ember-moment/helpers/moment-subtract"], function (_exports, _momentSubtract) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentSubtract.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-to-date", ["exports", "ember-moment/helpers/moment-to-date"], function (_exports, _momentToDate) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentToDate.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-to-now", ["exports", "ember-moment/helpers/moment-to-now"], function (_exports, _momentToNow) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentToNow.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-to", ["exports", "ember-moment/helpers/moment-to"], function (_exports, _momentTo) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _momentTo.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment-unix", ["exports", "ember-moment/helpers/unix"], function (_exports, _unix) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
;define("screwdriver-ui/helpers/moment", ["exports", "ember-moment/helpers/moment"], function (_exports, _moment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _moment.default;
    }
  });
});
;define("screwdriver-ui/helpers/next", ["exports", "ember-composable-helpers/helpers/next"], function (_exports, _next) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _next.default;
    }
  });
  Object.defineProperty(_exports, "next", {
    enumerable: true,
    get: function () {
      return _next.next;
    }
  });
});
;define("screwdriver-ui/helpers/not-eq", ["exports", "ember-truth-helpers/helpers/not-equal"], function (_exports, _notEqual) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _notEqual.default;
    }
  });
  Object.defineProperty(_exports, "notEq", {
    enumerable: true,
    get: function () {
      return _notEqual.notEq;
    }
  });
});
;define("screwdriver-ui/helpers/not", ["exports", "ember-truth-helpers/helpers/not"], function (_exports, _not) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _not.default;
    }
  });
  Object.defineProperty(_exports, "not", {
    enumerable: true,
    get: function () {
      return _not.not;
    }
  });
});
;define("screwdriver-ui/helpers/now", ["exports", "ember-moment/helpers/now"], function (_exports, _now) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _now.default;
    }
  });
});
;define("screwdriver-ui/helpers/object-at", ["exports", "ember-composable-helpers/helpers/object-at"], function (_exports, _objectAt) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _objectAt.default;
    }
  });
  Object.defineProperty(_exports, "objectAt", {
    enumerable: true,
    get: function () {
      return _objectAt.objectAt;
    }
  });
});
;define("screwdriver-ui/helpers/optional", ["exports", "ember-composable-helpers/helpers/optional"], function (_exports, _optional) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _optional.default;
    }
  });
  Object.defineProperty(_exports, "optional", {
    enumerable: true,
    get: function () {
      return _optional.optional;
    }
  });
});
;define("screwdriver-ui/helpers/or", ["exports", "ember-truth-helpers/helpers/or"], function (_exports, _or) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _or.default;
    }
  });
  Object.defineProperty(_exports, "or", {
    enumerable: true,
    get: function () {
      return _or.or;
    }
  });
});
;define("screwdriver-ui/helpers/perform", ["exports", "ember-concurrency/helpers/perform"], function (_exports, _perform) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _perform.default;
    }
  });
});
;define("screwdriver-ui/helpers/pipe-action", ["exports", "ember-composable-helpers/helpers/pipe-action"], function (_exports, _pipeAction) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _pipeAction.default;
    }
  });
});
;define("screwdriver-ui/helpers/pipe", ["exports", "ember-composable-helpers/helpers/pipe"], function (_exports, _pipe) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _pipe.default;
    }
  });
  Object.defineProperty(_exports, "pipe", {
    enumerable: true,
    get: function () {
      return _pipe.pipe;
    }
  });
});
;define("screwdriver-ui/helpers/pluralize", ["exports", "ember-inflector/lib/helpers/pluralize"], function (_exports, _pluralize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _pluralize.default;
  _exports.default = _default;
});
;define("screwdriver-ui/helpers/previous", ["exports", "ember-composable-helpers/helpers/previous"], function (_exports, _previous) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _previous.default;
    }
  });
  Object.defineProperty(_exports, "previous", {
    enumerable: true,
    get: function () {
      return _previous.previous;
    }
  });
});
;define("screwdriver-ui/helpers/promise-all", ["exports", "ember-promise-helpers/helpers/promise-all"], function (_exports, _promiseAll) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _promiseAll.default;
    }
  });
  Object.defineProperty(_exports, "promiseAll", {
    enumerable: true,
    get: function () {
      return _promiseAll.promiseAll;
    }
  });
});
;define("screwdriver-ui/helpers/promise-hash", ["exports", "ember-promise-helpers/helpers/promise-hash"], function (_exports, _promiseHash) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _promiseHash.default;
    }
  });
  Object.defineProperty(_exports, "promiseHash", {
    enumerable: true,
    get: function () {
      return _promiseHash.promiseHash;
    }
  });
});
;define("screwdriver-ui/helpers/promise-rejected-reason", ["exports", "ember-promise-helpers/helpers/promise-rejected-reason"], function (_exports, _promiseRejectedReason) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _promiseRejectedReason.default;
    }
  });
});
;define("screwdriver-ui/helpers/queue", ["exports", "ember-composable-helpers/helpers/queue"], function (_exports, _queue) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _queue.default;
    }
  });
  Object.defineProperty(_exports, "queue", {
    enumerable: true,
    get: function () {
      return _queue.queue;
    }
  });
});
;define("screwdriver-ui/helpers/range", ["exports", "ember-composable-helpers/helpers/range"], function (_exports, _range) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _range.default;
    }
  });
  Object.defineProperty(_exports, "range", {
    enumerable: true,
    get: function () {
      return _range.range;
    }
  });
});
;define("screwdriver-ui/helpers/reduce", ["exports", "ember-composable-helpers/helpers/reduce"], function (_exports, _reduce) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _reduce.default;
    }
  });
});
;define("screwdriver-ui/helpers/reject-by", ["exports", "ember-composable-helpers/helpers/reject-by"], function (_exports, _rejectBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _rejectBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/repeat", ["exports", "ember-composable-helpers/helpers/repeat"], function (_exports, _repeat) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _repeat.default;
    }
  });
  Object.defineProperty(_exports, "repeat", {
    enumerable: true,
    get: function () {
      return _repeat.repeat;
    }
  });
});
;define("screwdriver-ui/helpers/reverse", ["exports", "ember-composable-helpers/helpers/reverse"], function (_exports, _reverse) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _reverse.default;
    }
  });
});
;define("screwdriver-ui/helpers/send", ["exports", "ember-component-inbound-actions/helpers/send"], function (_exports, _send) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _send.default;
    }
  });
});
;define("screwdriver-ui/helpers/shuffle", ["exports", "ember-composable-helpers/helpers/shuffle"], function (_exports, _shuffle) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _shuffle.default;
    }
  });
  Object.defineProperty(_exports, "shuffle", {
    enumerable: true,
    get: function () {
      return _shuffle.shuffle;
    }
  });
});
;define("screwdriver-ui/helpers/singularize", ["exports", "ember-inflector/lib/helpers/singularize"], function (_exports, _singularize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _singularize.default;
  _exports.default = _default;
});
;define("screwdriver-ui/helpers/slice", ["exports", "ember-composable-helpers/helpers/slice"], function (_exports, _slice) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _slice.default;
    }
  });
});
;define("screwdriver-ui/helpers/sort-by", ["exports", "ember-composable-helpers/helpers/sort-by"], function (_exports, _sortBy) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _sortBy.default;
    }
  });
});
;define("screwdriver-ui/helpers/take", ["exports", "ember-composable-helpers/helpers/take"], function (_exports, _take) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _take.default;
    }
  });
});
;define("screwdriver-ui/helpers/task", ["exports", "ember-concurrency/helpers/task"], function (_exports, _task) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _task.default;
    }
  });
});
;define("screwdriver-ui/helpers/titleize", ["exports", "ember-cli-string-helpers/helpers/titleize"], function (_exports, _titleize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _titleize.default;
    }
  });
  Object.defineProperty(_exports, "titleize", {
    enumerable: true,
    get: function () {
      return _titleize.titleize;
    }
  });
});
;define("screwdriver-ui/helpers/toggle-action", ["exports", "ember-composable-helpers/helpers/toggle-action"], function (_exports, _toggleAction) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _toggleAction.default;
    }
  });
});
;define("screwdriver-ui/helpers/toggle", ["exports", "ember-composable-helpers/helpers/toggle"], function (_exports, _toggle) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _toggle.default;
    }
  });
  Object.defineProperty(_exports, "toggle", {
    enumerable: true,
    get: function () {
      return _toggle.toggle;
    }
  });
});
;define("screwdriver-ui/helpers/trim", ["exports", "ember-cli-string-helpers/helpers/trim"], function (_exports, _trim) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _trim.default;
    }
  });
  Object.defineProperty(_exports, "trim", {
    enumerable: true,
    get: function () {
      return _trim.trim;
    }
  });
});
;define("screwdriver-ui/helpers/truncate", ["exports", "ember-cli-string-helpers/helpers/truncate"], function (_exports, _truncate) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _truncate.default;
    }
  });
  Object.defineProperty(_exports, "truncate", {
    enumerable: true,
    get: function () {
      return _truncate.truncate;
    }
  });
});
;define("screwdriver-ui/helpers/underscore", ["exports", "ember-cli-string-helpers/helpers/underscore"], function (_exports, _underscore) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _underscore.default;
    }
  });
  Object.defineProperty(_exports, "underscore", {
    enumerable: true,
    get: function () {
      return _underscore.underscore;
    }
  });
});
;define("screwdriver-ui/helpers/union", ["exports", "ember-composable-helpers/helpers/union"], function (_exports, _union) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _union.default;
    }
  });
});
;define("screwdriver-ui/helpers/unix", ["exports", "ember-moment/helpers/unix"], function (_exports, _unix) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _unix.default;
    }
  });
});
;define("screwdriver-ui/helpers/uppercase", ["exports", "ember-cli-string-helpers/helpers/uppercase"], function (_exports, _uppercase) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _uppercase.default;
    }
  });
  Object.defineProperty(_exports, "uppercase", {
    enumerable: true,
    get: function () {
      return _uppercase.uppercase;
    }
  });
});
;define("screwdriver-ui/helpers/utc", ["exports", "ember-moment/helpers/utc"], function (_exports, _utc) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _utc.default;
    }
  });
  Object.defineProperty(_exports, "utc", {
    enumerable: true,
    get: function () {
      return _utc.utc;
    }
  });
});
;define("screwdriver-ui/helpers/w", ["exports", "ember-cli-string-helpers/helpers/w"], function (_exports, _w) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _w.default;
    }
  });
  Object.defineProperty(_exports, "w", {
    enumerable: true,
    get: function () {
      return _w.w;
    }
  });
});
;define("screwdriver-ui/helpers/without", ["exports", "ember-composable-helpers/helpers/without"], function (_exports, _without) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _without.default;
    }
  });
  Object.defineProperty(_exports, "without", {
    enumerable: true,
    get: function () {
      return _without.without;
    }
  });
});
;define("screwdriver-ui/helpers/x-duration", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.xDuration = xDuration;
  _exports.default = void 0;

  /**
   * Returns the difference between two times in 'HH:mm:ss' format
   * @method xDuration
   * @param  {Array}  times  List of 2 timestamps or other parseable time definitions
   * @return {String}        Duration string
   */
  function xDuration([time1, time2]) {
    if (!time1 || !time2) {
      return null;
    }

    const [t1, t2] = [new Date(time1), new Date(time2)];
    const diff = t2.getTime() - t1.getTime();
    return new Date(diff).toISOString().substr(11, 8);
  }

  var _default = Ember.Helper.helper(xDuration);

  _exports.default = _default;
});
;define("screwdriver-ui/helpers/xor", ["exports", "ember-truth-helpers/helpers/xor"], function (_exports, _xor) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _xor.default;
    }
  });
  Object.defineProperty(_exports, "xor", {
    enumerable: true,
    get: function () {
      return _xor.xor;
    }
  });
});
;define("screwdriver-ui/home/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    model() {
      if (Ember.get(this, 'session.isAuthenticated')) {
        // No reason to go fetch collections for a guest user
        if (Ember.get(this, 'session.data.authenticated.isGuest')) {
          return;
        }

        this.store.findAll('collection').then(collections => {
          if (Ember.get(collections, 'length')) {
            // Get the id of the last object in this array. The last
            // object will be the first collection created by the user.
            const routeId = Ember.get(collections, 'lastObject.id');
            this.replaceWith("/dashboards/".concat(routeId));
          }
        }).catch(() => {// do nothing
        });
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/home/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "8qfAU9Ai",
    "block": "{\"symbols\":[],\"statements\":[[1,[23,\"home-hero\"],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/home/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/initializers/add-modals-container", ["exports", "ember-modal-dialog/initializers/add-modals-container"], function (_exports, _addModalsContainer) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'add-modals-container',
    initialize: _addModalsContainer.default
  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/allow-link-action", ["exports", "ember-link-action/initializers/allow-link-action"], function (_exports, _allowLinkAction) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _allowLinkAction.default;
    }
  });
  Object.defineProperty(_exports, "initialize", {
    enumerable: true,
    get: function () {
      return _allowLinkAction.initialize;
    }
  });
});
;define("screwdriver-ui/initializers/app-version", ["exports", "ember-cli-app-version/initializer-factory", "screwdriver-ui/config/environment"], function (_exports, _initializerFactory, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  let name, version;

  if (_environment.default.APP) {
    name = _environment.default.APP.name;
    version = _environment.default.APP.version;
  }

  var _default = {
    name: 'App Version',
    initialize: (0, _initializerFactory.default)(name, version)
  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/component-styles", ["exports", "ember-component-css/initializers/component-styles", "screwdriver-ui/mixins/style-namespacing-extras"], function (_exports, _componentStyles, _styleNamespacingExtras) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _componentStyles.default;
    }
  });
  Object.defineProperty(_exports, "initialize", {
    enumerable: true,
    get: function () {
      return _componentStyles.initialize;
    }
  });
  // eslint-disable-next-line ember/new-module-imports
  Ember.Component.reopen(_styleNamespacingExtras.default);
});
;define("screwdriver-ui/initializers/container-debug-adapter", ["exports", "ember-resolver/resolvers/classic/container-debug-adapter"], function (_exports, _containerDebugAdapter) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'container-debug-adapter',

    initialize() {
      let app = arguments[1] || arguments[0];
      app.register('container-debug-adapter:main', _containerDebugAdapter.default);
      app.inject('container-debug-adapter:main', 'namespace', 'application:main');
    }

  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/debug", ["exports", "@html-next/vertical-collection/-debug"], function (_exports, _debug) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'vertical-collection-debug',

    initialize() {}

  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/ember-concurrency", ["exports", "ember-concurrency/initializers/ember-concurrency"], function (_exports, _emberConcurrency) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberConcurrency.default;
    }
  });
});
;define("screwdriver-ui/initializers/ember-data", ["exports", "ember-data/setup-container", "ember-data"], function (_exports, _setupContainer, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /*
  
    This code initializes Ember-Data onto an Ember application.
  
    If an Ember.js developer defines a subclass of DS.Store on their application,
    as `App.StoreService` (or via a module system that resolves to `service:store`)
    this code will automatically instantiate it and make it available on the
    router.
  
    Additionally, after an application's controllers have been injected, they will
    each have the store made available to them.
  
    For example, imagine an Ember.js application with the following classes:
  
    ```app/services/store.js
    import DS from 'ember-data';
  
    export default DS.Store.extend({
      adapter: 'custom'
    });
    ```
  
    ```app/controllers/posts.js
    import { Controller } from '@ember/controller';
  
    export default Controller.extend({
      // ...
    });
  
    When the application is initialized, `ApplicationStore` will automatically be
    instantiated, and the instance of `PostsController` will have its `store`
    property set to that instance.
  
    Note that this code will only be run if the `ember-application` package is
    loaded. If Ember Data is being used in an environment other than a
    typical application (e.g., node.js where only `ember-runtime` is available),
    this code will be ignored.
  */
  var _default = {
    name: 'ember-data',
    initialize: _setupContainer.default
  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/ember-responsive-breakpoints", ["exports", "ember-responsive/initializers/responsive"], function (_exports, _responsive) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _responsive.default;
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/ember-simple-auth", ["exports", "screwdriver-ui/config/environment", "ember-simple-auth/configuration", "ember-simple-auth/initializers/setup-session", "ember-simple-auth/initializers/setup-session-service", "ember-simple-auth/initializers/setup-session-restoration"], function (_exports, _environment, _configuration, _setupSession, _setupSessionService, _setupSessionRestoration) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'ember-simple-auth',

    initialize(registry) {
      const config = _environment.default['ember-simple-auth'] || {};
      config.rootURL = _environment.default.rootURL || _environment.default.baseURL;

      _configuration.default.load(config);

      (0, _setupSession.default)(registry);
      (0, _setupSessionService.default)(registry);
      (0, _setupSessionRestoration.default)(registry);
    }

  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/export-application-global", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.initialize = initialize;
  _exports.default = void 0;

  function initialize() {
    var application = arguments[1] || arguments[0];

    if (_environment.default.exportApplicationGlobal !== false) {
      var theGlobal;

      if (typeof window !== 'undefined') {
        theGlobal = window;
      } else if (typeof global !== 'undefined') {
        theGlobal = global;
      } else if (typeof self !== 'undefined') {
        theGlobal = self;
      } else {
        // no reasonable global, just bail
        return;
      }

      var value = _environment.default.exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember.String.classify(_environment.default.modulePrefix);
      }

      if (!theGlobal[globalName]) {
        theGlobal[globalName] = application;
        application.reopen({
          willDestroy: function () {
            this._super.apply(this, arguments);

            delete theGlobal[globalName];
          }
        });
      }
    }
  }

  var _default = {
    name: 'export-application-global',
    initialize: initialize
  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/load-bootstrap-config", ["exports", "screwdriver-ui/config/environment", "ember-bootstrap/config"], function (_exports, _environment, _config) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.initialize = initialize;
  _exports.default = void 0;

  function initialize()
  /* container, application */
  {
    _config.default.load(_environment.default['ember-bootstrap'] || {});
  }

  var _default = {
    name: 'load-bootstrap-config',
    initialize
  };
  _exports.default = _default;
});
;define("screwdriver-ui/initializers/viewport-config", ["exports", "ember-in-viewport/initializers/viewport-config"], function (_exports, _viewportConfig) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _viewportConfig.default;
    }
  });
  Object.defineProperty(_exports, "initialize", {
    enumerable: true,
    get: function () {
      return _viewportConfig.initialize;
    }
  });
});
;define("screwdriver-ui/instance-initializers/ember-data", ["exports", "ember-data/initialize-store-service"], function (_exports, _initializeStoreService) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'ember-data',
    initialize: _initializeStoreService.default
  };
  _exports.default = _default;
});
;define("screwdriver-ui/instance-initializers/ember-gestures", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    name: 'ember-gestures',
    initialize: function (instance) {
      if (typeof instance.lookup === "function") {
        instance.lookup('service:-gestures');
      } else {
        // This can be removed when we no-longer support ember 1.12 and 1.13
        Ember.getOwner(instance).lookup('service:-gestures');
      }
    }
  };
  _exports.default = _default;
});
;define("screwdriver-ui/instance-initializers/ember-simple-auth", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  // This is only needed for backwards compatibility and will be removed in the
  // next major release of ember-simple-auth. Unfortunately, there is no way to
  // deprecate this without hooking into Ember's internals…
  var _default = {
    name: 'ember-simple-auth',

    initialize() {}

  };
  _exports.default = _default;
});
;define("screwdriver-ui/instance-initializers/route-styles", ["exports", "ember-component-css/instance-initializers/route-styles"], function (_exports, _routeStyles) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _routeStyles.default;
    }
  });
  Object.defineProperty(_exports, "initialize", {
    enumerable: true,
    get: function () {
      return _routeStyles.initialize;
    }
  });
});
;define("screwdriver-ui/instance-initializers/supplementary-config", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.initialize = initialize;
  _exports.default = void 0;

  /**
   * initializer function to replace configuration with custom info
   * @method initialize
   */
  function initialize() {
    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDAPI_HOSTNAME) {
      _environment.default.APP.SDAPI_HOSTNAME = window.SUPPLEMENTARY_CONFIG.SDAPI_HOSTNAME;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDAPI_NAMESPACE) {
      _environment.default.APP.SDAPI_NAMESPACE = window.SUPPLEMENTARY_CONFIG.SDAPI_NAMESPACE;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDSTORE_HOSTNAME) {
      _environment.default.APP.SDSTORE_HOSTNAME = window.SUPPLEMENTARY_CONFIG.SDSTORE_HOSTNAME;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDSTORE_NAMESPACE) {
      _environment.default.APP.SDSTORE_NAMESPACE = window.SUPPLEMENTARY_CONFIG.SDSTORE_NAMESPACE;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SDDOC_URL) {
      _environment.default.APP.SDDOC_URL = window.SUPPLEMENTARY_CONFIG.SDDOC_URL;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.SLACK_URL) {
      _environment.default.APP.SLACK_URL = window.SUPPLEMENTARY_CONFIG.SLACK_URL;
    }

    if (window.SUPPLEMENTARY_CONFIG && window.SUPPLEMENTARY_CONFIG.ROOT_URL) {
      _environment.default.rootURL = window.SUPPLEMENTARY_CONFIG.ROOT_URL;
    }
  }

  var _default = {
    name: 'supplementary-config',
    initialize
  };
  _exports.default = _default;
});
;define("screwdriver-ui/job/model", ["exports", "screwdriver-ui/mixins/model-reloader", "ember-data", "screwdriver-ui/config/environment", "screwdriver-ui/utils/build"], function (_exports, _modelReloader, _emberData, _environment, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend(_modelReloader.default, {
    pipelineId: _emberData.default.attr('string'),
    name: _emberData.default.attr('string'),
    isPR: Ember.computed.match('name', /^PR-/),
    state: _emberData.default.attr('string'),
    stateChanger: _emberData.default.attr('string'),
    stateChangeTime: _emberData.default.attr('date'),
    stateChangeTimeWords: Ember.computed('stateChangeTime', {
      get() {
        const duration = Date.now() - +this.stateChangeTime;
        return "".concat(humanizeDuration(duration, {
          round: true,
          largest: 1
        }), " ago");
      }

    }),
    stateChangeMessage: _emberData.default.attr('string'),
    // !for pr job only {
    title: _emberData.default.attr('string'),
    group: Ember.computed('isPR', 'name', {
      get() {
        return this.isPR ? parseInt(this.name.slice('PR-'.length), 10) : null;
      }

    }),
    username: _emberData.default.attr('string'),
    userProfile: _emberData.default.attr('string'),
    url: _emberData.default.attr('string'),
    createTime: _emberData.default.attr('date'),
    createTimeWords: Ember.computed('createTime', {
      get() {
        const duration = Date.now() - +this.createTime;
        return "".concat(humanizeDuration(duration, {
          round: true,
          largest: 1
        }), " ago");
      }

    }),
    // } for pr job only
    permutations: _emberData.default.attr(),
    builds: _emberData.default.hasMany('build', {
      async: true
    }),
    isDisabled: Ember.computed.equal('state', 'DISABLED'),
    lastBuild: Ember.computed('builds', {
      get() {
        const {
          builds
        } = this;

        if (builds.length === 0) {
          return Ember.Object.create();
        }

        return builds.objectAt(0);
      }

    }),
    modelToReload: 'builds',
    reloadTimeout: _environment.default.APP.EVENT_RELOAD_TIMER,

    // Reload builds only if the pr job build is still running
    shouldReload() {
      return this.isPR && this.builds.any(b => (0, _build.isActiveBuild)(b.get('status'), b.get('endTime')));
    },

    init() {
      this._super(...arguments);

      this.startReloading();
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/job/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    /**
     * Override the serializeIntoHash
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      const dirty = snapshot.changedAttributes();
      Object.keys(dirty).forEach(key => {
        dirty[key] = dirty[key][1];
      });
      return Ember.assign(hash, dirty);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/login/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    router: Ember.inject.service(),
    session: Ember.inject.service('session'),
    scmContexts: Ember.computed.alias('model'),
    actions: {
      authenticate(scmContext) {
        this.session.authenticate('authenticator:screwdriver-api', scmContext).then(() => {
          this.get('router').transitionTo('home');
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/login/route", ["exports", "ember-simple-auth/mixins/unauthenticated-route-mixin"], function (_exports, _unauthenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_unauthenticatedRouteMixin.default, {
    scmService: Ember.inject.service('scm'),
    titleToken: 'Login',
    routeIfAlreadyAuthenticated: 'home',

    model() {
      return this.modelFor('application');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/login/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "EaxddCPJ",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"login-button\",null,[[\"authenticate\",\"scmContexts\"],[[29,\"action\",[[24,0,[]],\"authenticate\"],null],[25,[\"scmContexts\"]]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/login/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/metric/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    pipelineId: _emberData.default.attr('string'),
    createTime: _emberData.default.attr('date'),
    causeMessage: _emberData.default.attr('string'),
    sha: _emberData.default.attr('string'),
    queuedTime: _emberData.default.attr('number'),
    imagePullTime: _emberData.default.attr('number'),
    duration: _emberData.default.attr('number'),
    status: _emberData.default.attr('string', {
      defaultValue: 'UNKNOWN'
    }),
    builds: _emberData.default.attr(),
    jobId: _emberData.default.attr('number'),
    eventId: _emberData.default.attr('number'),
    steps: _emberData.default.attr()
  });

  _exports.default = _default;
});
;define("screwdriver-ui/mixins/link-action", ["exports", "ember-link-action/mixins/link-action"], function (_exports, _linkAction) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _linkAction.default;
    }
  });
});
;define("screwdriver-ui/mixins/model-reloader", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Mixin.create({
    /**
     * Parameter to indicate reloading is paused
     */
    isPaused: false,

    /**
     * Overridable function to determine if a model should be reloaded
     * @method shouldReload
     * @param {Object}    model  The model that is to be reloaded
     * @return {Boolean}          True is model should be reloaded
     */
    shouldReload() {
      return this.runLater;
    },

    /**
     * Schedules reload of events data
     * @method scheduleReload
     */
    scheduleReload() {
      // The testing environment waits for asyncronous operations to complete.
      // If the reloader is active during tests, the tests will always timeout.
      // I'm not sure of a better way to handle this
      if (_environment.default.environment !== 'test') {
        const runLater = Ember.run.later(this, 'reloadModel', this.reloadTimeout);
        this.set('runLater', runLater);
      }
    },

    /**
     * Reloads the list of events
     * @method reloadEvents
     */
    reloadModel() {
      const {
        modelToReload
      } = this;
      let model; // Let Controller provide a reload() to refresh it's dependencies

      if (!modelToReload && typeof this.reload === 'function') {
        model = this;
      } else {
        model = this.get(modelToReload);
      }

      if (model && this.shouldReload(model)) {
        if (this.isPaused) {
          this.scheduleReload();
        } else {
          model.reload().finally(() => this.scheduleReload());
        }
      }
    },

    /**
     * Starts reloading if not already doing so
     * @method startReloading
     */
    startReloading() {
      if (!this.runLater) {
        this.scheduleReload();
      }
    },

    /**
     * Stops reloading
     * @method stopReloading
     */
    stopReloading() {
      if (this.runLater) {
        Ember.run.cancel(this.runLater);
        this.set('runLater', null);
      }
    },

    /**
     * Forces model reload
     * @method forceReload
     */
    forceReload() {
      Ember.run.cancel(this.runLater); // Push this reload out of current run loop.

      const forceLater = Ember.run.later(this, 'reloadModel', _environment.default.APP.FORCE_RELOAD_WAIT);
      this.set('runLater', forceLater);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/mixins/style-namespacing-extras", ["exports", "ember-component-css/mixins/style-namespacing-extras"], function (_exports, _styleNamespacingExtras) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _styleNamespacingExtras.default;
    }
  });
});
;define("screwdriver-ui/page-not-found/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "b2LYijQT",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"error-view\",null,[[\"statusCode\",\"statusMessage\",\"errorMessage\"],[[25,[\"model\",\"reason\",\"errors\",\"statusCode\"]],[25,[\"model\",\"reason\",\"errors\",\"error\"]],[25,[\"model\",\"reason\",\"errors\",\"message\"]]]]],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/page-not-found/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline-startall/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    /**
     * Start all child pipelines
     * @method startAll
     * @param   {Number}  pipelineId
     * @return  {Promise}            Resolve nothing if success otherwise reject with error message
     */
    startAll(pipelineId) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/pipelines/").concat(pipelineId, "/startall");
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url,
          type: 'POST',
          headers: {
            Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
          }
        }).done(() => resolve()).fail(jqXHR => reject(JSON.parse(jqXHR.responseText).message));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline-triggers/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    /**
     * Get all downstream triggers for jobs in a pipeline
     * @method getDownstreamTriggers
     * @param   {Number}  pipelineId
     * @return  {Promise}            Resolve nothing if success otherwise reject with error message
     */
    getDownstreamTriggers(pipelineId) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/pipelines/").concat(pipelineId, "/triggers");
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url,
          type: 'GET',
          headers: {
            Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
          }
        }).done(data => resolve(data)).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = "".concat(response.status, " ").concat(response.responseJSON.message);
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/build/controller", ["exports", "ember-cli-jwt-decode", "screwdriver-ui/config/environment", "screwdriver-ui/utils/build"], function (_exports, _emberCliJwtDecode, _environment, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    prEventsService: Ember.inject.service('pr-events'),
    session: Ember.inject.service('session'),
    loading: false,
    counter: 0,
    build: Ember.computed.reads('model.build'),
    job: Ember.computed.reads('model.job'),
    event: Ember.computed.reads('model.event'),
    pipeline: Ember.computed.reads('model.pipeline'),
    stepList: Ember.computed.mapBy('build.steps', 'name'),
    isShowingModal: false,
    errorMessage: '',
    prEvents: Ember.computed('model.{event.pr.url,pipeline.id}', {
      get() {
        if (this.get('model.event.type') === 'pr') {
          const event = this.get('model.event.pr.url');
          const pipeline = this.get('model.pipeline.id');
          const jobId = this.get('job.id');

          if (event) {
            return this.prEventsService.getPRevents(pipeline, event, jobId);
          }
        }

        return [];
      }

    }),
    actions: {
      stopBuild() {
        const {
          build
        } = this;
        build.set('status', 'ABORTED');
        return build.save().catch(e => {
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        });
      },

      startBuild() {
        this.set('isShowingModal', true);
        const buildId = Ember.get(this, 'build.id');
        const token = Ember.get(this, 'session.data.authenticated.token');
        const user = Ember.get((0, _emberCliJwtDecode.jwt_decode)(token), 'username');
        const causeMessage = "Manually started by ".concat(user);
        const newEvent = this.store.createRecord('event', {
          buildId,
          causeMessage
        });
        return newEvent.save().then(() => newEvent.get('builds').then(builds => {
          this.set('isShowingModal', false);
          return this.transitionToRoute('pipeline.build', builds.get('lastObject.id'));
        })).catch(e => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        });
      },

      reload() {
        Ember.run.throttle(this, 'reloadBuild', _environment.default.APP.BUILD_RELOAD_TIMER);
      },

      changeBuild(pipelineId, buildId) {
        return this.transitionToRoute('pipeline.build', pipelineId, buildId);
      },

      changeBuildStep(name) {
        this.changeBuildStep(name);
      }

    },

    /**
     * Schedules a build to reload after a certain amount of time
     * @method reloadBuild
     * @param  {Number}    [timeout=ENV.APP.BUILD_RELOAD_TIMER] ms to wait before reloading
     */
    reloadBuild(timeout = _environment.default.APP.BUILD_RELOAD_TIMER) {
      const {
        build
      } = this;
      const status = build.get('status'); // reload again in a little bit if queued

      if (!this.loading) {
        if (status === 'QUEUED' || status === 'RUNNING') {
          Ember.run.later(this, () => {
            if (!build.get('isDeleted') && !this.loading) {
              this.set('loading', true);
              build.reload().then(() => {
                this.set('loading', false);
                Ember.run.throttle(this, 'reloadBuild', timeout);
                this.changeBuildStep();
              });
            }
          }, timeout);
        } else {
          // refetch builds which are part of current event
          this.event.hasMany('builds').reload();
        }
      }
    },

    changeBuildStep(name) {
      const build = this.get('build');
      const pipelineId = this.get('pipeline.id');
      let activeStep;

      if (name) {
        activeStep = name;
        this.set('userSelectedStepName', name);
      } else if (!this.userSelectedStepName) {
        activeStep = (0, _build.getActiveStep)(Ember.get(build, 'steps'));
      }

      if (activeStep && this.get('preselectedStepName') !== activeStep) {
        this.transitionToRoute('pipeline.build.step', pipelineId, build.get('id'), activeStep);
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/build/route", ["exports", "screwdriver-ui/utils/build"], function (_exports, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    routeAfterAuthentication: 'pipeline.build',

    model(params) {
      this.set('pipeline', this.modelFor('pipeline').pipeline);
      return this.store.findRecord('build', params.build_id).then(build => Ember.RSVP.all([this.store.findRecord('job', build.get('jobId')), this.store.findRecord('event', build.get('eventId'))]).then(([job, event]) => ({
        build,
        job,
        event,
        pipeline: this.pipeline
      })));
    },

    afterModel(model) {
      const pipelineId = model.pipeline.get('id'); // Build not found for this pipeline, redirecting to the pipeline page

      if (pipelineId !== model.job.get('pipelineId')) {
        this.transitionTo('pipeline', pipelineId);
      } else {
        Ember.set(model.event, 'isPaused', true);
      }
    },

    titleToken(model) {
      return "".concat(model.job.get('name'), " > #").concat(model.build.get('truncatedSha'));
    },

    deactivate() {
      const model = this.modelFor(this.routeName);
      Ember.set(model.event, 'isPaused', false);
      Ember.set(model, 'userSelectedStepName', null);
    },

    redirect(model, transition) {
      if (transition.targetName !== 'pipeline.build.step') {
        const name = (0, _build.getActiveStep)(Ember.get(model, 'build.steps'));

        if (name) {
          this.transitionTo('pipeline.build.step', model.pipeline.get('id'), model.build.get('id'), name);
        }
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/build/step/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    routeAfterAuthentication: 'pipeline.build',

    model(params) {
      this.controllerFor('pipeline.build').set('preselectedStepName', params.step_id); // return parent route model

      return this.modelFor('pipeline.build');
    },

    afterModel(model) {
      if (!model) {
        return;
      }

      const stepName = this.controllerFor('pipeline.build').get('preselectedStepName');

      if (!model.build.get('steps').findBy('name', stepName)) {
        this.transitionTo('pipeline.build', model.pipeline.get('id'), model.build.get('id'));
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/build/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "UkZamkKw",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"blockDuration\",\"imagePullDuration\",\"buildDuration\",\"buildStatus\",\"buildCreate\",\"buildStart\",\"buildEnd\",\"buildSteps\",\"buildId\",\"buildMeta\",\"jobName\",\"jobId\",\"isAuthenticated\",\"event\",\"prEvents\",\"onStart\",\"onStop\",\"reloadBuild\",\"changeBuild\"],[[25,[\"build\",\"buildContainer\"]],[25,[\"build\",\"totalDuration\"]],[25,[\"build\",\"blockedDuration\"]],[25,[\"build\",\"imagePullDuration\"]],[25,[\"build\",\"buildDuration\"]],[25,[\"build\",\"status\"]],[25,[\"build\",\"createTime\"]],[25,[\"build\",\"startTime\"]],[25,[\"build\",\"endTime\"]],[25,[\"build\",\"steps\"]],[25,[\"build\",\"id\"]],[25,[\"build\",\"meta\"]],[25,[\"job\",\"name\"]],[25,[\"job\",\"id\"]],[25,[\"session\",\"isAuthenticated\"]],[25,[\"event\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],\"startBuild\"],null],[29,\"action\",[[24,0,[]],\"stopBuild\"],null],[29,\"action\",[[24,0,[]],\"reload\"],null],[29,\"action\",[[24,0,[]],\"changeBuild\"],null]]]],false],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[false,\"center\",true]],{\"statements\":[[0,\"    \"],[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"],[4,\"if\",[[25,[\"build\",\"statusMessage\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"build\",\"statusMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[4,\"if\",[[25,[\"stepList\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"build-step-collection\",null,[[\"preselectedStepName\",\"pipelineId\",\"buildStatus\",\"buildId\",\"buildSteps\",\"buildStart\",\"buildStats\",\"changeBuildStep\"],[[25,[\"preselectedStepName\"]],[25,[\"pipeline\",\"id\"]],[25,[\"build\",\"status\"]],[25,[\"build\",\"id\"]],[25,[\"build\",\"steps\"]],[25,[\"build\",\"startTime\"]],[25,[\"build\",\"stats\"]],[29,\"action\",[[24,0,[]],\"changeBuildStep\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/build/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/child-pipelines/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service(),
    pipelines: Ember.computed.reads('model.pipelines'),
    pipeline: Ember.computed.reads('model.pipeline')
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/child-pipelines/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    session: Ember.inject.service(),
    routeAfterAuthentication: 'pipeline.child-pipelines',
    titleToken: 'Child Pipelines',

    model() {
      // Guests should not access this page
      if (Ember.get(this, 'session.data.authenticated.isGuest')) {
        this.transitionTo('pipeline');
      }

      const {
        pipeline
      } = this.modelFor('pipeline');
      return this.store.query('pipeline', {
        configPipelineId: pipeline.id
      }).then(pipelines => ({
        pipelines,
        pipeline
      }));
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/child-pipelines/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "wCDWxHmm",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipeline\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"pipeline-list\",null,[[\"pipelines\",\"pipeline\"],[[25,[\"pipelines\"]],[25,[\"pipeline\"]]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/child-pipelines/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service('session'),
    pipeline: Ember.computed.alias('model.pipeline'),
    collections: Ember.computed.alias('model.collections'),
    actions: {
      addToCollection(pipelineId, collectionId) {
        return this.store.findRecord('collection', collectionId).then(collection => {
          const pipelineIds = collection.get('pipelineIds');

          if (!pipelineIds.includes(pipelineId)) {
            collection.set('pipelineIds', [...pipelineIds, pipelineId]);
          }

          return collection.save();
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/events/controller", ["exports", "ember-cli-jwt-decode", "screwdriver-ui/config/environment", "screwdriver-ui/mixins/model-reloader", "screwdriver-ui/utils/build"], function (_exports, _emberCliJwtDecode, _environment, _modelReloader, _build) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend(_modelReloader.default, {
    session: Ember.inject.service(),
    stop: Ember.inject.service('event-stop'),

    init() {
      this._super(...arguments);

      this.startReloading();
      this.set('eventsPage', 1);
      this.set('showDownstreamTriggers', false);
    },

    reload() {
      try {
        this.send('refreshModel');
      } catch (e) {
        return Promise.resolve(e);
      }

      return Promise.resolve();
    },

    isShowingModal: false,
    isFetching: false,
    activeTab: 'events',
    moreToShow: true,
    errorMessage: '',
    jobs: Ember.computed('model.jobs', {
      get() {
        const jobs = this.get('model.jobs');
        return jobs.filter(j => !(0, _build.isPRJob)(j.get('name')));
      }

    }),
    paginateEvents: [],
    prChainEnabled: Ember.computed.alias('pipeline.prChain'),
    completeWorkflowGraph: Ember.computed('model.triggers.@each.triggers', {
      get() {
        const workflowGraph = this.get('pipeline.workflowGraph');
        const triggers = this.get('model.triggers');
        const completeGraph = workflowGraph; // Add extra node if downstream triggers exist

        if (triggers && triggers.length > 0) {
          triggers.forEach(t => {
            if (t.triggers && t.triggers.length > 0) {
              completeGraph.edges.push({
                src: t.jobName,
                dest: "~sd-".concat(t.jobName, "-triggers")
              });
              completeGraph.nodes.push({
                name: "~sd-".concat(t.jobName, "-triggers"),
                triggers: t.triggers,
                status: 'DOWNSTREAM_TRIGGER'
              });
            }
          });
        }

        return completeGraph;
      }

    }),
    currentEventType: Ember.computed('activeTab', {
      get() {
        return this.activeTab === 'pulls' ? 'pr' : 'pipeline';
      }

    }),
    // Aggregates first page events and events via ModelReloaderMixin
    modelEvents: Ember.computed('model.events', {
      get() {
        let previousModelEvents = this.previousModelEvents || [];
        let currentModelEvents = this.get('model.events').toArray();
        let newModelEvents = [];
        const newPipelineId = this.get('pipeline.id'); // purge unmatched pipeline events

        if (previousModelEvents.some(e => e.get('pipelineId') !== newPipelineId)) {
          newModelEvents = [...currentModelEvents];
          this.set('paginateEvents', []);
          this.set('previousModelEvents', newModelEvents);
          this.set('moreToShow', true);
          return newModelEvents;
        }

        previousModelEvents = previousModelEvents.filter(e => !currentModelEvents.find(c => c.id === e.id));
        newModelEvents = currentModelEvents.concat(previousModelEvents);
        this.set('previousModelEvents', newModelEvents);
        return newModelEvents;
      }

    }),
    pipelineEvents: Ember.computed('modelEvents', 'paginateEvents', {
      get() {
        return [].concat(this.modelEvents, this.paginateEvents);
      }

    }),
    prEvents: Ember.computed('model.events', 'prChainEnabled', {
      get() {
        if (this.prChainEnabled) {
          return this.get('model.events').filter(e => e.prNum).sortBy('createTime').reverse();
        }

        return [];
      }

    }),
    events: Ember.computed('pipelineEvents', 'prEvents', 'currentEventType', {
      get() {
        if (this.currentEventType === 'pr') {
          return this.prEvents;
        }

        return this.pipelineEvents;
      }

    }),
    pullRequestGroups: Ember.computed('model.jobs', {
      get() {
        const jobs = this.get('model.jobs');
        let groups = {};
        return jobs.filter(j => j.get('isPR')).sortBy('createTime').reverse().reduce((results, j) => {
          const k = j.get('group');

          if (groups[k] === undefined) {
            groups[k] = results.length;
            results[groups[k]] = [j];
          } else {
            results[groups[k]].push(j);
          }

          return results;
        }, []);
      }

    }),
    isRestricted: Ember.computed('pipeline.annotations', {
      get() {
        const annotations = this.getWithDefault('pipeline.annotations', {});
        return (annotations['screwdriver.cd/restrictPR'] || 'none') !== 'none';
      }

    }),
    selectedEvent: Ember.computed('selected', 'mostRecent', {
      get() {
        return this.selected || this.mostRecent;
      }

    }),
    selectedEventObj: Ember.computed('selectedEvent', {
      get() {
        const selected = this.selectedEvent;

        if (selected === 'aggregate') {
          return null;
        }

        return this.events.find(e => Ember.get(e, 'id') === selected);
      }

    }),
    mostRecent: Ember.computed('events.@each.status', {
      get() {
        const list = this.events || [];
        const event = list.find(e => Ember.get(e, 'status') === 'RUNNING');

        if (!event) {
          return list.length ? Ember.get(list[0], 'id') : 0;
        }

        return Ember.get(event, 'id');
      }

    }),
    lastSuccessful: Ember.computed('events.@each.status', {
      get() {
        const list = this.events || [];
        const event = list.find(e => Ember.get(e, 'status') === 'SUCCESS');

        if (!event) {
          return 0;
        }

        return Ember.get(event, 'id');
      }

    }),

    updateEvents(page) {
      if (this.currentEventType === 'pr') {
        return null;
      }

      this.set('isFetching', true);
      return this.store.query('event', {
        pipelineId: Ember.get(this, 'pipeline.id'),
        page,
        count: _environment.default.APP.NUM_EVENTS_LISTED
      }).then(events => {
        const nextEvents = events.toArray();

        if (Array.isArray(nextEvents)) {
          if (nextEvents.length < _environment.default.APP.NUM_EVENTS_LISTED) {
            this.set('moreToShow', false);
          }

          this.set('eventsPage', page);
          this.set('isFetching', false); // FIXME: Skip duplicate ones if new events got added added to the head
          // of events list

          this.set('paginateEvents', this.paginateEvents.concat(nextEvents));
        }
      });
    },

    checkForMorePage({
      scrollTop,
      scrollHeight,
      clientHeight
    }) {
      if (scrollTop + clientHeight > scrollHeight - 300) {
        this.updateEvents(this.eventsPage + 1);
      }
    },

    actions: {
      setDownstreamTrigger() {
        this.set('showDownstreamTriggers', !this.get('showDownstreamTriggers'));
      },

      updateEvents(page) {
        this.updateEvents(page);
      },

      onEventListScroll({
        currentTarget
      }) {
        if (this.moreToShow && !this.isFetching) {
          this.checkForMorePage(currentTarget);
        }
      },

      startMainBuild() {
        this.set('isShowingModal', true);
        const token = Ember.get(this, 'session.data.authenticated.token');
        const user = Ember.get((0, _emberCliJwtDecode.jwt_decode)(token), 'username');
        const pipelineId = this.get('pipeline.id');
        const newEvent = this.store.createRecord('event', {
          pipelineId,
          startFrom: '~commit',
          causeMessage: "Manually started by ".concat(user)
        });
        return newEvent.save().then(() => {
          this.set('isShowingModal', false);
          this.forceReload();
          return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
        }).catch(e => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        });
      },

      startDetachedBuild(job) {
        const buildId = Ember.get(job, 'buildId');
        let parentBuildId = null;

        if (buildId) {
          const build = this.store.peekRecord('build', buildId);
          parentBuildId = Ember.get(build, 'parentBuildId');
        }

        const event = this.selectedEventObj;
        const parentEventId = Ember.get(event, 'id');
        const pipelineId = Ember.get(this, 'pipeline.id');
        const token = Ember.get(this, 'session.data.authenticated.token');
        const user = Ember.get((0, _emberCliJwtDecode.jwt_decode)(token), 'username');
        const causeMessage = "Manually started by ".concat(user);
        const prNum = Ember.get(event, 'prNum');
        let startFrom = Ember.get(job, 'name');

        if (prNum) {
          // PR-<num>: prefix is needed, if it is a PR event.
          startFrom = "PR-".concat(prNum, ":").concat(startFrom);
        }

        const newEvent = this.store.createRecord('event', {
          buildId,
          pipelineId,
          startFrom,
          parentBuildId,
          parentEventId,
          causeMessage
        });
        this.set('isShowingModal', true);
        return newEvent.save().then(() => {
          this.set('isShowingModal', false);
          this.forceReload();
          const path = "pipeline/".concat(newEvent.get('pipelineId'), "/").concat(this.activeTab);
          return this.transitionToRoute(path);
        }).catch(e => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        });
      },

      stopBuild(job) {
        const buildId = Ember.get(job, 'buildId');
        let build;

        if (buildId) {
          build = this.store.peekRecord('build', buildId);
          build.set('status', 'ABORTED');
          return build.save().then(() => job.hasMany('builds').reload()).catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
        }

        return new Promise.Resolve();
      },

      stopEvent() {
        const event = Ember.get(this, 'selectedEventObj');
        const eventId = Ember.get(event, 'id');
        return this.get('stop').stopBuilds(eventId).catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
      },

      startPRBuild(prNum, jobs) {
        this.set('isShowingModal', true);
        const user = Ember.get((0, _emberCliJwtDecode.jwt_decode)(this.get('session.data.authenticated.token')), 'username');
        const newEvent = this.store.createRecord('event', {
          causeMessage: "Manually started by ".concat(user),
          pipelineId: this.get('pipeline.id'),
          startFrom: '~pr',
          prNum
        });
        return newEvent.save().then(() => newEvent.get('builds').then(() => {
          this.set('isShowingModal', false); // PR events are aggregated by each PR jobs when prChain is enabled.

          if (this.prChainEnabled) {
            const newEvents = this.prEvents.filter(e => e.get('prNum') !== prNum);
            newEvents.unshiftObject(newEvent);
            this.set('prEvents', newEvents);
          }
        })).catch(e => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        }).finally(() => jobs.forEach(j => j.hasMany('builds').reload()));
      }

    },

    willDestroy() {
      // FIXME: Never called when route is no longer active
      this.stopReloading();
    },

    reloadTimeout: _environment.default.APP.EVENT_RELOAD_TIMER
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/events/route", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    triggerService: Ember.inject.service('pipeline-triggers'),
    routeAfterAuthentication: 'pipeline.events',

    beforeModel() {
      this.set('pipeline', this.modelFor('pipeline').pipeline);
    },

    setupController(controller, model) {
      this._super(controller, model);

      controller.set('activeTab', 'events');
    },

    model() {
      this.controllerFor('pipeline.events').set('pipeline', this.pipeline);
      return Ember.RSVP.hash({
        jobs: this.get('pipeline.jobs'),
        events: this.store.query('event', {
          pipelineId: this.get('pipeline.id'),
          page: 1,
          count: _environment.default.APP.NUM_EVENTS_LISTED
        }),
        triggers: this.triggerService.getDownstreamTriggers(this.get('pipeline.id'))
      });
    },

    actions: {
      refreshModel: function refreshModel() {
        this.refresh();
      }
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/events/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "pto3Hwn2",
    "block": "{\"symbols\":[\"tab\",\"prg\",\"nav\"],\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[4,\"if\",[[29,\"not\",[[25,[\"session\",\"data\",\"authenticated\",\"isGuest\"]]],null]],null,{\"statements\":[[0,\"    \"],[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipeline\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\"],[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-9 separator partial-view\"],[9],[0,\"\\n    \"],[1,[29,\"pipeline-graph-nav\",null,[[\"mostRecent\",\"lastSuccessful\",\"graphType\",\"selectedEvent\",\"selectedEventObj\",\"selected\",\"showDownstreamTriggers\",\"setDownstreamTrigger\",\"startMainBuild\",\"startPRBuild\",\"prGroups\",\"stopEvent\"],[[25,[\"mostRecent\"]],[25,[\"lastSuccessful\"]],[25,[\"currentEventType\"]],[25,[\"selectedEvent\"]],[25,[\"selectedEventObj\"]],[25,[\"selected\"]],[25,[\"showDownstreamTriggers\"]],[29,\"action\",[[24,0,[]],\"setDownstreamTrigger\"],null],[29,\"action\",[[24,0,[]],\"startMainBuild\"],null],[29,\"action\",[[24,0,[]],\"startPRBuild\"],null],[25,[\"pullRequestGroups\"]],[29,\"action\",[[24,0,[]],\"stopEvent\"],null]]]],false],[0,\"\\n\\n    \"],[1,[29,\"pipeline-workflow\",null,[[\"showDownstreamTriggers\",\"completeWorkflowGraph\",\"workflowGraph\",\"jobs\",\"selectedEventObj\",\"selected\",\"startDetachedBuild\",\"stopBuild\",\"authenticated\"],[[25,[\"showDownstreamTriggers\"]],[25,[\"completeWorkflowGraph\"]],[25,[\"pipeline\",\"workflowGraph\"]],[25,[\"jobs\"]],[25,[\"selectedEventObj\"]],[25,[\"selected\"]],[29,\"action\",[[24,0,[]],\"startDetachedBuild\"],null],[29,\"action\",[[24,0,[]],\"stopBuild\"],null],[25,[\"session\",\"isAuthenticated\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-3 no-padding column-tabs-view partial-view\"],[12,\"onScroll\",[29,\"action\",[[24,0,[]],\"onEventListScroll\"],null]],[9],[0,\"\\n\"],[4,\"bs-tab\",null,[[\"customTabs\"],[true]],{\"statements\":[[4,\"bs-nav\",null,[[\"type\"],[\"tabs\"]],{\"statements\":[[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L40:C11) \"],null]],[[\"active\"],[[29,\"bs-eq\",[[25,[\"activeTab\"]],\"events\"],null]]],{\"statements\":[[0,\"          \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L41:C13) \"],null],\"pipeline.events\"],[[\"class\"],[\"nav-link\"]],{\"statements\":[[0,\"Events\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"item\"]],\"expected `nav.item` to be a contextual component but found a string. Did you mean `(component nav.item)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L43:C11) \"],null]],[[\"active\"],[[29,\"bs-eq\",[[25,[\"activeTab\"]],\"pulls\"],null]]],{\"statements\":[[0,\"          \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,3,[\"link-to\"]],\"expected `nav.link-to` to be a contextual component but found a string. Did you mean `(component nav.link-to)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L44:C13) \"],null],\"pipeline.pulls\"],[[\"class\"],[\"nav-link\"]],{\"statements\":[[0,\"Pull Requests\"]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[3]},null],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"tab-content\"],[9],[0,\"\\n\"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"pane\"]],\"expected `tab.pane` to be a contextual component but found a string. Did you mean `(component tab.pane)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L49:C11) \"],null]],[[\"activeId\",\"elementId\",\"title\"],[[25,[\"activeTab\"]],\"events\",\"Events\"]],{\"statements\":[[0,\"          \"],[1,[29,\"pipeline-events-list\",null,[[\"events\",\"selected\",\"selectedEvent\",\"lastSuccessful\",\"mostRecent\",\"eventsPage\",\"updateEvents\"],[[25,[\"events\"]],[29,\"mut\",[[25,[\"selected\"]]],null],[25,[\"selectedEvent\"]],[25,[\"lastSuccessful\"]],[25,[\"mostRecent\"]],[25,[\"eventsPage\"]],[29,\"action\",[[24,0,[]],\"updateEvents\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,1,[\"pane\"]],\"expected `tab.pane` to be a contextual component but found a string. Did you mean `(component tab.pane)`? ('screwdriver-ui/pipeline/events/template.hbs' @ L60:C11) \"],null]],[[\"activeId\",\"elementId\",\"title\"],[[25,[\"activeTab\"]],\"pulls\",\"Pull Requests\"]],{\"statements\":[[4,\"if\",[[25,[\"prChainEnabled\"]]],null,{\"statements\":[[0,\"            \"],[1,[29,\"pipeline-events-list\",null,[[\"events\",\"selected\",\"selectedEvent\",\"lastSuccessful\",\"eventsPage\",\"updateEvents\"],[[25,[\"events\"]],[29,\"mut\",[[25,[\"selected\"]]],null],[25,[\"selectedEvent\"]],[25,[\"lastSuccessful\"]],[25,[\"eventsPage\"]],[29,\"action\",[[24,0,[]],\"updateEvents\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[4,\"each\",[[25,[\"pullRequestGroups\"]]],null,{\"statements\":[[0,\"              \"],[1,[29,\"pipeline-pr-list\",null,[[\"jobs\",\"isRestricted\",\"startBuild\"],[[24,2,[]],[25,[\"isRestricted\"]],[29,\"action\",[[24,0,[]],\"startPRBuild\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[2]},{\"statements\":[[0,\"              \"],[7,\"div\"],[11,\"class\",\"alert\"],[9],[0,\"No open pull requests\"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]}]],\"parameters\":[]},null],[0,\"      \"],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"isShowingModal\"]]],null,{\"statements\":[[4,\"modal-dialog\",null,[[\"clickOutsideToClose\",\"targetAttachment\",\"translucentOverlay\"],[false,\"center\",true]],{\"statements\":[[0,\"    \"],[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"parameters\":[]},null]],\"parameters\":[]},null],[0,\"\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/events/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/index/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    routeAfterAuthentication: 'pipeline',

    beforeModel() {
      const {
        pipeline
      } = this.modelFor('pipeline');

      if (pipeline.get('childPipelines')) {
        this.transitionTo('pipeline.child-pipelines');
      } else {
        this.transitionTo('pipeline.events');
      }
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/metrics/controller", ["exports", "screwdriver-ui/utils/build", "jquery", "screwdriver-ui/utils/time-range"], function (_exports, _build, _jquery, _timeRange) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const locked = Symbol('locked');

  var _default = Ember.Controller.extend({
    router: Ember.inject.service(),
    session: Ember.inject.service(),
    queryParams: [{
      jobId: {
        type: 'string'
      }
    }],
    inTrendlineView: false,
    isUTC: false,
    eventsChartName: 'eventsChart',
    buildsChartName: 'buildsChart',
    stepsChartName: 'stepsChart',
    selectedRange: '1wk',
    timeRanges: [{
      alias: '6hr',
      value: '6hr'
    }, {
      alias: '12hr',
      value: '12hr'
    }, {
      alias: '1d',
      value: '1d'
    }, {
      alias: '1wk',
      value: '1wk'
    }, {
      alias: '1mo',
      value: '1mo'
    }, {
      alias: '3mo',
      value: '3mo'
    }, {
      alias: '6mo',
      value: '180d'
    }],
    successOnly: Ember.computed.alias('model.successOnly'),
    selectedJobName: Ember.computed('model.jobId', 'metrics.jobMap', {
      get() {
        const jobId = this.get('model.jobId');
        const jobMap = this.get('metrics.jobMap');
        return Object.keys(jobMap).find(k => jobMap[k] === jobId);
      }

    }),
    startTime: Ember.computed.alias('model.startTime'),
    endTime: Ember.computed.alias('model.endTime'),
    measures: Ember.computed.alias('metrics.measures'),
    metrics: Ember.computed.alias('model.metrics'),
    jobs: Ember.computed('metrics.jobMap', {
      get() {
        const jobMap = this.get('metrics.jobMap');
        return Object.keys(jobMap).map(j => j.toString()).sort((a, b) => jobMap[a] - jobMap[b]);
      }

    }),
    // flatpickr addon seems to prefer dates in string
    customRange: Ember.computed('startTime', 'endTime', {
      get() {
        return ['startTime', 'endTime'].map(t => (0, _timeRange.toCustomLocaleString)(new Date(this.get(t)), {
          options: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }
        }));
      }

    }),

    init() {
      this._super(...arguments);

      this.reinit();
    },

    reinit() {
      // clear all those flags b/c this is a controller
      this.set('selectedRange', '1wk');
      this.set('inTrendlineView', false);
      this.set('isUTC', false); // safety step to release references

      this.set(this.eventsChartName, null);
      this.set(this.buildsChartName, null);
      this.set(this.stepsChartName, null);
    },

    /**
     * Memoized range generator
     * Generator code borrowed from MDN:
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from#Sequence_generator_(range)
     *
     * @param {Number} start start of the range
     * @param {Number} stop  end of the range
     * @param {Number} step  step to increment
     */
    range: memoizerific(5)((start, stop, step) => Array.from({
      length: (stop - start) / step + 1
    }, (_, i) => start + i * step)),
    eventMetrics: Ember.computed('metrics.events', {
      get() {
        let {
          queuedTime,
          imagePullTime,
          duration,
          total,
          status
        } = this.get('metrics.events');
        return {
          columns: [['total', ...total], ['duration', ...duration], ['imagePullTime', ...imagePullTime], ['queuedTime', ...queuedTime]],
          types: {
            queuedTime: 'bar',
            imagePullTime: 'bar',
            duration: 'bar',
            total: 'line'
          },
          names: {
            queuedTime: 'Queued',
            imagePullTime: 'Image Pull',
            duration: 'Duration',
            total: 'Event Duration'
          },
          hide: this.inTrendlineView ? ['queuedTime', 'imagePullTime', 'duration'] : 'total',
          colors: {
            queuedTime: '#c5c5c5',
            imagePullTime: '#dfdfdf',
            duration: '#16c045',
            total: '#0066df'
          },
          groups: [['queuedTime', 'imagePullTime', 'duration']],

          color(color, d) {
            // return color of the status of the corresponding event in the pipeline
            return d && d.id === 'duration' && status[d.index] !== 'SUCCESS' ? '#ea0000' : color;
          }

        };
      }

    }),
    eventLegend: Ember.computed('inTrendlineView', 'metrics.events', {
      get() {
        if (this.inTrendlineView) {
          return [{
            key: 'total',
            name: 'Event Duration',
            style: Ember.String.htmlSafe('border-color:#0066df')
          }];
        }

        return [{
          key: 'duration',
          name: 'Duration',
          style: Ember.String.htmlSafe('border-color:#16c045 #ea0000 #ea0000 #16c045')
        }, {
          key: 'queuedTime',
          name: 'Queued',
          style: Ember.String.htmlSafe('border-color:#c5c5c5')
        }, {
          key: 'imagePullTime',
          name: 'Image Pull',
          style: Ember.String.htmlSafe('border-color:#dfdfdf')
        }];
      }

    }),
    buildMetrics: Ember.computed('metrics.builds', 'jobs', {
      get() {
        const builds = this.get('metrics.builds');
        const {
          jobs
        } = this;
        return {
          json: builds,
          keys: {
            value: jobs
          },
          type: 'bar',
          groups: [jobs]
        };
      }

    }),
    buildLegend: Ember.computed('jobs}', {
      get() {
        const colors = this.get('color.pattern');
        return this.jobs.map((name, i) => ({
          key: name,
          name,
          style: Ember.String.htmlSafe("border-color:".concat(colors[i % colors.length]))
        }));
      }

    }),
    stepMetrics: Ember.computed('metrics.{steps,stepGroup}', {
      get() {
        const {
          steps: {
            data
          },
          stepGroup
        } = this.metrics;
        return {
          json: data,
          keys: {
            value: stepGroup
          },
          type: 'bar',
          groups: [stepGroup]
        };
      }

    }),
    stepLegend: Ember.computed('metrics.stepGroup}', {
      get() {
        const stepGroup = this.get('metrics.stepGroup');
        const colors = this.get('color.pattern');
        return stepGroup.map((name, i) => ({
          key: name,
          name,
          style: Ember.String.htmlSafe("border-color:".concat(colors[i % colors.length]))
        }));
      }

    }),
    // serves as a template for axis related configs
    axis: Ember.computed(function axis() {
      const self = this;
      let dateOptions;
      return {
        y: {
          tick: {
            outer: false
          },
          padding: {
            top: 10,
            bottom: 0
          }
        },
        x: {
          // no need to pass categories data because we are generating cutom ticks
          type: 'category',
          label: {
            get text() {
              return "".concat(self.get('isUTC') ? 'UTC' : 'LOCAL', " DATE TIME");
            },

            position: 'outer-center'
          },
          height: 70,
          tick: {
            centered: true,
            outer: false,
            fit: false,
            multiline: true,
            multilineMax: 2,
            width: 80,

            /**
             * Generate the responsive row of tick labels for x-axis
             *
             * @param {Array<Number>} domain array containing the start and end of the current domain
             * @returns {Array<Number>} array containing the indexes of desired tick labels
             */
            values(times, domain) {
              const [x0, x1] = domain.map(Math.floor);
              const offset = 1;
              const canvasWidth = self.get('eventsChart').internal.width;
              const diff = times[x1 - 2] - times[x0];
              let tickLabelWidth = 80; // show only date string if longer than a week
              // more specific mappings are possible

              if (diff > _timeRange.CONSTANT.WEEK) {
                tickLabelWidth = 70;
                dateOptions = {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                };
              } else {
                dateOptions = undefined;
              }

              let step = 1;
              let values = self.range(x0, x1 - offset, step);
              const maxAllowedLabels = Math.floor(canvasWidth / tickLabelWidth); // loop for better displayed labels

              while (values.length > maxAllowedLabels) {
                step += 2;
                values = self.range(x0, x1 - offset, step);
              }

              return values;
            },

            /**
             * Tick label formatter
             *
             * @param {Number} i domain value for which the tick label locates
             * @returns
             */
            format(times, i) {
              const d = times[Math.floor(i)];
              const timeZone = self.get('isUTC') ? 'UTC' : undefined; // local date time string

              return d ? "".concat((0, _timeRange.toCustomLocaleString)(d, {
                timeZone,
                options: dateOptions
              })) : '';
            }

          }
        }
      };
    }),

    generateAxis(metricType) {
      const {
        axis
      } = this;
      const times = this.get("metrics.".concat(metricType, ".createTime"));
      let {
        values,
        format
      } = axis.x.tick;
      values = values.bind(null, times);
      format = format.bind(null, times); // override default with configured functions

      return {
        y: { ...axis.y
        },
        x: { ...axis.x,
          tick: { ...axis.x.tick,
            values,
            format
          }
        }
      };
    },

    eventsAxis: Ember.computed('axis', 'metrics.events.createTime', 'isUTC', {
      get() {
        return this.generateAxis('events');
      }

    }),
    stepsAxis: Ember.computed('axis', 'metrics.steps', 'isUTC', {
      get() {
        return this.generateAxis('steps');
      }

    }),
    tooltip: Ember.computed('metrics.events', 'isUTC', {
      get() {
        const self = this;
        return {
          /**
           * Sieve for left position
           *
           * @returns {Object} contains left position for tooltip
           */
          position() {
            return {
              left: this.tooltipPosition(...arguments).left
            };
          },

          /**
           * Tooltip content generator
           *
           * @returns {String} safe HTML string to be displayed for tooltip
           */
          contents() {
            const [data,,, color] = arguments;
            const i = data[0].index;
            const router = self.get('router');
            const pipelineId = self.get('pipeline.id');
            const getBuildId = self.get('metrics.getBuildId');
            const timeZone = self.get('isUTC') ? 'UTC' : undefined; // compact destructure assignments

            const [{
              sha,
              status,
              createTime
            }, buildId] = this.name === self.get('stepsChartName') ? [self.get('metrics.steps'), getBuildId('step', i)] : [self.get('metrics.events'), getBuildId('build', i)];
            const s = status[i]; // collect grouped data and generate a map for data HTML

            const htmls = data.sort((a, b) => b.value - a.value).reduce((html, d) => {
              const c = d.id === 'duration' && s !== 'SUCCESS' ? '#ea0000' : color(d.id);
              let {
                name
              } = d;
              let url; // add deep-link to build/step if possible

              if (this.name === self.get('stepsChartName')) {
                url = router.urlFor('pipeline.build.step', pipelineId, buildId, name);
              } else if (this.name === self.get('buildsChartName')) {
                url = router.urlFor('pipeline.build', pipelineId, buildId[name] || buildId);
              }

              if (url) {
                name = "<a href=\"".concat(url, "\" target=\"_blank\">").concat(name, "</a>");
              }

              if (d.value) {
                html.keys.push("<p class=\"legend\" style=\"border-color:".concat(c, "\">").concat(name, "</p>"));
                html.values.push("<p>".concat(humanizeDuration(d.value * 60 * 1e3, {
                  round: true
                }), "</p>"));
              }

              return html;
            }, {
              keys: [],
              values: []
            });
            return Ember.String.htmlSafe("<div class=\"".concat(s, "\">\n              <div class=\"status\">\n                <i aria-hidden=\"true\" class=\"fa fa-fw fa-").concat((0, _build.statusIcon)(s, true), "\"></i>\n                <strong class=\"sha\">#").concat((sha[i] || '').substr(0, 7), "</strong>\n                <i aria-hidden=\"true\" class=\"lock fa fa-fw fa-thumb-tack\"></i>\n                <i aria-hidden=\"true\" class=\"clipboard fa fa-fw fa-clipboard\"></i>\n              </div>\n              <div class=\"detail\">\n                <div class=\"key\">\n                  <p>Build Time</p>\n                  ").concat(htmls.keys.join(''), "\n                </div>\n                <div class=\"value\">\n                  <p>").concat((0, _timeRange.toCustomLocaleString)(createTime[i], {
              timeZone
            }), "</p>\n                  ").concat(htmls.values.join(''), "\n                </div>\n              </div>\n            </div>"));
          }

        };
      }

    }),
    color: {
      // first dozen were from designs, rest from random generator
      pattern: ['#87d812', '#fed800', '#1ac6f4', '#6e2ebf', '#1f77b4', '#aec7e8', '#ff7f0e', '#2ca02c', '#ffbb78', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5', '#dd6130', '#e0924e', '#e0e03e', '#29799e', '#0ad6d6', '#9549d8', '#6fc11d', '#5dfc5d', '#395fa0', '#ff60d7', '#f907ed', '#e5dc2b', '#46ceba', '#047255', '#5bc42b', '#ce1296', '#efd64a', '#4b0cd3', '#af3be5', '#63ff73', '#3e5cb7', '#f23eaa', '#76259e', '#60f2b3', '#ddbd1c', '#becc2c']
    },
    size: {
      height: 280
    },
    padding: {
      top: 20
    },
    transition: {
      duration: 300
    },
    interaction: {
      enabled: false
    },
    legend: {
      show: false
    },
    grid: {
      y: {
        show: true
      }
    },
    bar: {
      width: {
        ratio: 0.6
      }
    },
    point: {
      r: 4
    },
    subchart: {
      show: false
    },
    zoom: {
      rescale: true
    },
    onInitFns: Ember.computed(function onInitOuter() {
      const self = this;
      const {
        eventsChartName,
        buildsChartName,
        stepsChartName
      } = this;
      /**
       * unlock tooltip
       *
       */

      function unlockTooltip() {
        this.tooltip.classed('locked', false);
      }
      /**
       * Set up custom elements and event handlers
       *
       */


      function setupExtras() {
        // add the cursor line
        const cursorLine = this.svg.append('line').style('stroke', '#888').style('stroke-dasharray', '3').style('pointer-events', 'none').attr('class', 'cursor-line').attr('x1', -100).attr('x2', -100).attr('y1', 0).attr('y2', this.height).attr('transform', this.getTranslate('main'));
        let previousIndexDomain = null;
        this.api.tooltip[locked] = false;
        this.eventRect.on('mousedown.cursor', () => {
          // click again to unlock tooltip
          if (this.api.tooltip[locked]) {
            this.api.tooltip[locked] = false;
            previousIndexDomain = null;
            unlockTooltip.call(this);
            this.hideTooltip();
            return;
          }

          if (previousIndexDomain === null) {
            this.hideTooltip();
          } else {
            // clicked near data domain
            this.api.tooltip[locked] = true;
            this.tooltip.classed('locked', true);
          }
        });
        this.eventRect.on('mousemove.cursor', () => {
          const [x] = d3.mouse(this.eventRect.node()); // always move the cursor line

          cursorLine.attr('x1', x).attr('x2', x);
          const rangeOffset = this.xAxis.tickOffset(); // calculate reference distance for edges and midpoint of a bar
          // reuse the same for line chart

          const [leftEdgeDomain, midPointDomain, rightEdgeDomain] = [-1, 0, 1].map(n => Math.floor(this.x.invert(x - rangeOffset * (1 - n * this.config.bar_width_ratio))));
          const currentIndexDomain = rightEdgeDomain; // if all three are the same, we are outside of bar

          if (leftEdgeDomain === midPointDomain && midPointDomain === rightEdgeDomain) {
            previousIndexDomain = null;
            this.eventRect.classed('data', false); // remains locked if it was locked before

            if (this.api.tooltip[locked]) {
              return;
            }

            this.api.tooltip[locked] = false;
            this.hideTooltip();
          } else if (previousIndexDomain === null || currentIndexDomain !== previousIndexDomain) {
            this.eventRect.classed('data', true);

            if (this.api.tooltip[locked]) {
              return;
            }

            let hidden = new Set(this.hiddenTargetIds);
            previousIndexDomain = currentIndexDomain;
            this.showTooltip(this.data.targets.reduce((data, {
              id,
              values
            }) => {
              if (!hidden.has(id)) {
                data.push(this.addName(values[currentIndexDomain]));
              }

              return data;
            }, []), this.eventRect.node());
          }
        }); // escape hatch for last chance to cancel out tooltip effect

        this.selectChart.on('mouseleave', () => {
          previousIndexDomain = null;

          if (!this.api.tooltip[locked]) {
            this.hideTooltip();
          }
        }); // copy all text inside the tooltip

        this.tooltip.on('click', () => {
          if (d3.event.target.classList.contains('clipboard')) {
            const range = document.createRange();
            const selection = window.getSelection();
            selection.removeAllRanges();
            range.selectNodeContents(this.tooltip.node());
            selection.addRange(range);
            document.execCommand('copy');
            selection.removeAllRanges();
          }
        });
      }
      /**
       * Set up drag and zoom
       *
       * @param {Array<String>} conjugateChartNames names of the conjugate chart, e.g. Events <-> Builds
       */


      function setupDragZoom(...conjugateChartNames) {
        // get the inverted domain values from d3
        const getZoomedDomain = selection => selection && selection.map(x => this.x.invert(x));

        const brush = d3.brushX().on('start', () => {
          const [x0, x1] = getZoomedDomain(d3.event.selection); // this won't reset zoom level on every click drag event

          if (x0 !== x1 && Math.abs(x1 - x0) >= 1) {
            [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
              if (c) {
                c.unzoom();
              }
            });
          }

          this.svg.select(".".concat(this.CLASS.eventRects, " .selection")).classed('hide', false);
        }).on('brush', () => {
          [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
            if (c) {
              unlockTooltip.call(c.internal);
              c.tooltip[locked] = false;
              c.internal.hideTooltip();
            }
          });
        }).on('end', () => {
          if (d3.event.selection === null) {
            return;
          }

          let zoomedDomain = getZoomedDomain(d3.event.selection);
          const offsetFromRightEdge = 0.01;
          const [x0, x1] = zoomedDomain; // need to have a tiny bit offset from right edge to prevent crossing over the next point

          zoomedDomain = [Math.floor(x0), Math.ceil(x1) - offsetFromRightEdge];
          [this.api, ...conjugateChartNames.map(n => self.get(n))].forEach(c => {
            if (c) {
              c.zoom(zoomedDomain);
            }
          });
          this.svg.select(".".concat(this.CLASS.eventRects, " .selection")).classed('hide', true);
        }); // make the default event listening area also the overlay for d3 brush for drag event

        d3.select(this.eventRect.data([{
          type: 'overlay'
        }]).node().parentElement).call(brush); // remove the default overlay area generated by d3 brush

        this.main.select('.overlay').remove();
      }
      /**
       * Set up different shims for overriding c3 behaviors
       *
       */


      function shimHandlers() {
        this.windowFocusHandler = Function.prototype;
      }
      /**
       * Custom init callback for setting up custom behaviors
       *
       * @param {String} chartName name of the targeted chart
       * @param {Array<String>} conjugateChartNames names of the conjugate chart
       */


      function onInitInner(chartName, ...conjugateChartNames) {
        self.set(chartName, this.api);
        setupExtras.call(this);
        setupDragZoom.apply(this, conjugateChartNames);
        shimHandlers.call(this);
      }

      return {
        [eventsChartName]() {
          onInitInner.call(this, eventsChartName, buildsChartName);
        },

        [buildsChartName]() {
          onInitInner.call(this, buildsChartName, eventsChartName);
        },

        [stepsChartName]() {
          onInitInner.call(this, stepsChartName);
        }

      };
    }),

    setDates(start, end) {
      if (this.startTime !== start || this.endTime !== end) {
        this.set('startTime', start);
        this.set('endTime', end); // send to router to refresh model accordingly

        this.send('setFetchDates', start, end);
      }
    },

    actions: {
      toggleTrendlineView(enabledTrendline) {
        const chart = this.eventsChart;
        const savedZoomDomain = chart.internal.x.orgDomain();
        this.set('inTrendlineView', enabledTrendline);

        if (enabledTrendline) {
          chart.show('total');
          chart.hide(['queuedTime', 'imagePullTime', 'duration']);
        } else {
          chart.show(['queuedTime', 'imagePullTime', 'duration']);
          chart.hide('total');
        } // restore previous zoom level


        chart.zoom(savedZoomDomain);
      },

      toggleSuccessOnly() {
        this.send('filterSuccessOnly');
      },

      selectJob(name) {
        const {
          [name]: id
        } = this.get('metrics.jobMap');

        if (id && this.selectedJobName !== name) {
          this.send('setJobId', id);
          this.transitionToRoute({
            queryParams: {
              jobId: id
            }
          });
        } else {
          this.set('errorMessage', "Unknown Job: ".concat(name));
        }
      },

      setTimeRange(range) {
        if (this.selectedRange === range) {
          return;
        }

        this.set('selectedRange', range);
        const {
          startTime,
          endTime
        } = (0, _timeRange.default)(new Date(), range); // trigger router model change with new dates after both dates are set
        // endTime first cuz end time doesn't change within a minute
        // but startTime does per every range change

        this.setDates(startTime, endTime);
      },

      setCustomRange([start, end]) {
        this.set('selectedRange'); // always set end to a minute before EOD, and of local time

        end.setHours(23, 59, 59);
        this.setDates(start.toISOString(), end.toISOString());
      },

      resetZoom(chartName, ...conjugateChartNames) {
        // pop the last item, which is the actual event object
        conjugateChartNames.pop();
        [this.get(chartName), ...conjugateChartNames.map(n => this.get(n))].forEach(c => {
          if (!c) {
            return;
          } // precise way to do unzoom


          const orgDomain = c.internal.subX.orgDomain();
          const [org0, org1] = orgDomain;
          const [x0, x1] = c.internal.x.orgDomain();

          if (org0 !== x0 || org1 !== x1) {
            c.zoom(orgDomain);
          }

          c.tooltip[locked] = false;
          c.internal.hideTooltip();
          c.internal.tooltip.classed('locked', false);
        });
      },

      onLegendHover(key, chartName) {
        this.get(chartName).focus(key);
      },

      onLegendHoverOut(chartName) {
        this.get(chartName).revert();
      },

      onLegendClick(key, chartName, {
        currentTarget,
        target
      }) {
        const chart = this.get(chartName);
        const wasHidden = currentTarget.classList.contains('unselected'); // must have at least one legend/data displayed
        // empty chart could introduce issues around domain in c3

        if (!wasHidden && chart.internal.data.targets.length - chart.internal.hiddenTargetIds.length === 1) {
          return;
        } // override redraw to ditch drawing options
        // to prevent redraw resetting zoomed domain


        const internalRedraw = chart.internal.redraw;

        chart.internal.redraw = function redraw(...args) {
          internalRedraw.apply(this, args.slice(1));
        }; // if clicked on "only"


        if (currentTarget !== target) {
          chart.show(key);
          chart.hide(Object.keys(chart.internal.config.data_types).filter(k => k !== key));
          (0, _jquery.default)(currentTarget).removeClass('unselected').siblings().addClass('unselected');
        } else {
          chart.toggle(key);
          currentTarget.classList.toggle('unselected');
        }

        chart.internal.redraw = internalRedraw;
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/metrics/route", ["exports", "screwdriver-ui/utils/time-range"], function (_exports, _timeRange) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    init() {
      this._super(...arguments);

      this.reinit();
    },

    reinit() {
      const {
        startTime,
        endTime
      } = (0, _timeRange.default)(new Date(), '1wk'); // these are used for querying, so they are in ISO8601 format

      this.set('startTime', startTime);
      this.set('endTime', endTime); // these controls which endpoints should be in use

      this.set('fetchAll', true);
      this.set('fetchJob', false); // these are passed into controller too

      this.set('successOnly', false);
      this.set('jobId');
    },

    beforeModel() {
      this.set('pipeline', this.modelFor('pipeline').pipeline);
    },

    afterModel() {
      this.set('fetchAll', false);
      this.set('fetchJob', false);
    },

    deactivate() {
      this.reinit();
      this.controllerFor('pipeline.metrics').reinit();
    },

    model({
      jobId = this.jobId
    }) {
      const controller = this.controllerFor('pipeline.metrics');
      controller.set('pipeline', this.pipeline);
      const {
        successOnly,
        fetchAll,
        fetchJob,
        startTime,
        endTime
      } = this;

      const toMinute = (sec = null) => sec === null ? null : sec / 60;

      const jobsMap = this.get('pipeline.jobs').then(jobs => jobs.reduce((map, j) => {
        const id = j.get('id');
        const name = j.get('name');

        if (!map.has(id)) {
          map.set("".concat(id), name);
        }

        return map;
      }, new Map()));

      if (jobId) {
        this.set('jobId', jobId);
      }

      const metrics = Ember.RSVP.all([jobsMap, fetchAll ? this.store.query('metric', {
        pipelineId: this.get('pipeline.id'),
        startTime,
        endTime
      }) : Ember.RSVP.resolve(this.pipelineMetrics), // eslint-disable-next-line no-nested-ternary
      fetchJob || fetchAll ? jobId ? this.store.query('metric', {
        jobId,
        startTime,
        endTime
      }) : Ember.RSVP.resolve() : Ember.RSVP.resolve(this.jobMetrics)]).then(([jobs, pipelineMetrics, jobMetrics]) => {
        // acts as cache
        this.set('pipelineMetrics', pipelineMetrics);
        this.set('jobMetrics', jobMetrics);
        const total = pipelineMetrics.get('length');
        let events = {
          queuedTime: [],
          imagePullTime: [],
          duration: [],
          total: [],
          sha: [],
          status: [],
          createTime: []
        };
        let steps = {};
        let builds = [];
        let buildIds = [];
        let stepGroup = new Set();
        let jobMap = {};
        let passCount = 0;
        let sum = {
          queuedTime: 0,
          imagePullTime: 0,
          duration: 0
        };
        /**
         * Map index to build id, gathered from pipeline and job metrics
         *
         * @param {String} type type of the requesting metric
         * @param {Number} index index of inquiry
         * @returns {Number|null} build id(s) of the located build
         */

        function getBuildId(type, index) {
          if (type === 'step') {
            return +jobMetrics.objectAt(index).get('id');
          }

          if (type === 'build') {
            return buildIds[index];
          }

          return null;
        }

        pipelineMetrics.forEach(metric => {
          const sha = metric.get('sha');
          const status = metric.get('status');
          const duration = metric.get('duration');
          const queuedTime = metric.get('queuedTime');
          const imagePullTime = metric.get('imagePullTime');

          if (status === 'SUCCESS') {
            passCount += 1;
          } else if (successOnly) {
            return;
          }

          events.sha.push(sha);
          events.status.push(status);
          events.duration.push(toMinute(duration));
          events.queuedTime.push(toMinute(queuedTime));
          events.imagePullTime.push(toMinute(imagePullTime));
          events.createTime.push(metric.get('createTime'));
          events.total.push(toMinute(duration + queuedTime + imagePullTime));
          sum.duration += duration;
          sum.queuedTime += queuedTime;
          sum.imagePullTime += imagePullTime;
          const buildInfo = metric.get('builds').reduce((info, b) => {
            const jobName = jobs.get("".concat(b.jobId));

            if (jobName) {
              jobMap[jobName] = "".concat(b.jobId);
              info.values[jobName] = toMinute(b.duration);
              info.ids[jobName] = b.id;
            }

            return info;
          }, {
            ids: {},
            values: {}
          });
          builds.push(buildInfo.values);
          buildIds.push(buildInfo.ids);
        });

        if (jobMetrics) {
          steps = {
            sha: [],
            status: [],
            createTime: [],
            data: []
          };
          jobMetrics.forEach(metric => {
            const status = metric.get('status');

            if (successOnly && status !== 'SUCCESS') {
              return;
            }

            steps.sha.push(metric.get('sha'));
            steps.status.push(status);
            steps.createTime.push(metric.get('createTime'));
            steps.data.push(metric.get('steps').reduce((stepMetric, s) => {
              const stepName = s.name;

              if (stepName) {
                stepGroup.add(stepName);
                stepMetric[stepName] = toMinute(s.duration);
              }

              return stepMetric;
            }, {}));
          });
        } // clear error message


        controller.set('errorMessage');
        return {
          events,
          builds,
          jobMap,
          steps,
          stepGroup: Array.from(stepGroup).map(s => s.toString()).sort(),
          measures: {
            total,
            passed: passCount,
            failed: total - passCount,
            avgs: {
              queuedTime: humanizeDuration(sum.queuedTime * 1e3 / total, {
                round: true
              }),
              imagePullTime: humanizeDuration(sum.imagePullTime * 1e3 / total, {
                round: true
              }),
              duration: humanizeDuration(sum.duration * 1e3 / total, {
                round: true
              })
            }
          },
          getBuildId
        };
      }).catch(({
        errors: [{
          detail
        }]
      }) => {
        // catch what's thrown by the upstream RESTAdapter
        // e.g. bad request error about 180 day max
        // error message to be shown as banner
        controller.set('errorMessage', detail);
        return controller.get('model.metrics');
      });
      return Ember.RSVP.hash({
        metrics,
        startTime,
        endTime,
        successOnly,
        jobId
      });
    },

    actions: {
      setFetchDates(start, end) {
        this.set('startTime', start);
        this.set('endTime', end);
        this.set('fetchAll', true);
        this.refresh();
      },

      setJobId(jobId) {
        this.set('jobId', jobId);
        this.set('fetchJob', true);
        this.refresh();
      },

      filterSuccessOnly() {
        this.toggleProperty('successOnly');
        this.refresh();
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/metrics/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "YN58NeRh",
    "block": "{\"symbols\":[\"job\",\"lg\",\"job\",\"lg\",\"lg\",\"bg\",\"range\"],\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipeline\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"chart-controls\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"chart-control range-selection\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Time Range\"],[10],[0,\"\\n\"],[4,\"bs-button-group\",null,[[\"value\",\"type\",\"onChange\"],[[25,[\"selectedRange\"]],\"radio\",[29,\"action\",[[24,0,[]],\"setTimeRange\"],null]]],{\"statements\":[[4,\"each\",[[25,[\"timeRanges\"]]],null,{\"statements\":[[0,\"        \"],[4,\"component\",[[29,\"-assert-implicit-component-helper-argument\",[[24,6,[\"button\"]],\"expected `bg.button` to be a contextual component but found a string. Did you mean `(component bg.button)`? ('screwdriver-ui/pipeline/metrics/template.hbs' @ L15:C11) \"],null]],[[\"value\"],[[24,7,[\"value\"]]]],{\"statements\":[[1,[24,7,[\"alias\"]],false]],\"parameters\":[]},null],[0,\"\\n\"]],\"parameters\":[7]},null]],\"parameters\":[6]},null],[0,\"  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"chart-control custom-date-selection\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Custom Date Range\"],[10],[0,\"\\n    \"],[1,[29,\"ember-flatpickr\",null,[[\"clickOpens\",\"dateFormat\",\"date\",\"locale\",\"mode\",\"onChange\",\"onClose\",\"placeholder\"],[true,\"m/d/Y\",[25,[\"customRange\"]],\"en\",\"range\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"dateValues\"]]],null]],null],[29,\"action\",[[24,0,[]],\"setCustomRange\"],null],\"Choose Start & End Date Time\"]]],false],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[1,[29,\"x-toggle\",null,[[\"size\",\"theme\",\"showLabels\",\"value\",\"offLabel\",\"onLabel\",\"onToggle\"],[\"small\",\"material\",true,[25,[\"isUTC\"]],\"Local\",\"UTC\",[29,\"action\",[[24,0,[]],[29,\"mut\",[[25,[\"isUTC\"]]],null]],null]]]],false],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"chart-control filters-selection\"],[9],[0,\"\\n    \"],[1,[29,\"x-toggle\",null,[[\"size\",\"theme\",\"showLabels\",\"value\",\"offLabel\",\"onLabel\",\"onToggle\"],[\"small\",\"material\",true,[25,[\"successOnly\"]],null,\"Success Only\",[29,\"action\",[[24,0,[]],\"toggleSuccessOnly\"],null]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[7,\"div\"],[11,\"class\",\"chart-pipeline-info\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"measure\"],[9],[1,[29,\"if\",[[25,[\"measures\",\"total\"]],[25,[\"measures\",\"total\"]],\"N/A\"],null],false],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Total Events\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"measure\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"measures\",\"total\"]]],null,{\"statements\":[[0,\"        \"],[7,\"span\"],[11,\"class\",\"passed\"],[9],[1,[25,[\"measures\",\"passed\"]],false],[10],[0,\" / \"],[7,\"span\"],[11,\"class\",\"failed\"],[9],[1,[25,[\"measures\",\"failed\"]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"        N/A\\n\"]],\"parameters\":[]}],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Passed / Failed Jobs\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"measure\"],[9],[1,[29,\"if\",[[25,[\"measures\",\"total\"]],[25,[\"measures\",\"avgs\",\"duration\"]],\"N/A\"],null],false],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Avg. Build Time\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"measure\"],[9],[1,[29,\"if\",[[25,[\"measures\",\"total\"]],[25,[\"measures\",\"avgs\",\"imagePullTime\"]],\"N/A\"],null],false],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Avg. Image Pull Time\"],[10],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col\"],[9],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"measure\"],[9],[1,[29,\"if\",[[25,[\"measures\",\"total\"]],[25,[\"measures\",\"avgs\",\"queuedTime\"]],\"N/A\"],null],false],[10],[0,\"\\n    \"],[7,\"br\"],[9],[10],[0,\"\\n    \"],[7,\"span\"],[11,\"class\",\"title\"],[9],[0,\"Avg. Queued Time\"],[10],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"measures\",\"total\"]]],null,{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"chart-c3\"],[9],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"chart-title\"],[9],[0,\"Events\"],[10],[0,\"\\n    \"],[1,[29,\"x-toggle\",null,[[\"size\",\"theme\",\"showLabels\",\"value\",\"offLabel\",\"onLabel\",\"onToggle\"],[\"small\",\"material\",true,[25,[\"inTrendlineView\"]],null,\"Trendline View\",[29,\"action\",[[24,0,[]],\"toggleTrendlineView\"],null]]]],false],[0,\"\\n    \"],[7,\"ul\"],[11,\"class\",\"list-inline chart-legend\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"eventLegend\"]]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[12,\"style\",[24,5,[\"style\"]]],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"onLegendClick\",[24,5,[\"key\"]],[25,[\"eventsChartName\"]]],null]],[12,\"onmouseenter\",[29,\"action\",[[24,0,[]],\"onLegendHover\",[24,5,[\"key\"]],[25,[\"eventsChartName\"]]],null]],[12,\"onmouseleave\",[29,\"action\",[[24,0,[]],\"onLegendHoverOut\",[25,[\"eventsChartName\"]]],null]],[9],[0,\"\\n          \"],[1,[24,5,[\"name\"]],false],[0,\" \"],[7,\"a\"],[9],[0,\"only\"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[5]},null],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"y-axis-label\"],[9],[0,\"TIME (MIN)\"],[10],[0,\"\\n    \"],[1,[29,\"chart-c3\",null,[[\"name\",\"data\",\"axis\",\"grid\",\"interaction\",\"bar\",\"legend\",\"tooltip\",\"subchart\",\"point\",\"size\",\"transition\",\"color\",\"padding\",\"zoom\",\"onrendered\",\"onresized\",\"oninit\"],[[25,[\"eventsChartName\"]],[25,[\"eventMetrics\"]],[25,[\"eventsAxis\"]],[25,[\"grid\"]],[25,[\"interaction\"]],[25,[\"bar\"]],[25,[\"legend\"]],[25,[\"tooltip\"]],[25,[\"subchart\"]],[25,[\"point\"]],[25,[\"size\"]],[25,[\"transition\"]],[25,[\"color\"]],[25,[\"padding\"]],[25,[\"zoom\"]],[25,[\"onrendered\"]],[25,[\"onresized\"]],[29,\"get\",[[25,[\"onInitFns\"]],[25,[\"eventsChartName\"]]],null]]]],false],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"reset-button\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"resetZoom\",[25,[\"eventsChartName\"]],[25,[\"buildsChartName\"]]],null]],[11,\"title\",\"Reset Zoom Level\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n  \"],[7,\"div\"],[11,\"class\",\"chart-c3\"],[9],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"chart-title\"],[9],[0,\"Build Breakdown Per Event\"],[10],[0,\"\\n    \"],[7,\"ul\"],[11,\"class\",\"list-inline chart-legend\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"buildLegend\"]]],null,{\"statements\":[[0,\"        \"],[7,\"li\"],[12,\"style\",[24,4,[\"style\"]]],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"onLegendClick\",[24,4,[\"key\"]],[25,[\"buildsChartName\"]]],null]],[12,\"onmouseenter\",[29,\"action\",[[24,0,[]],\"onLegendHover\",[24,4,[\"key\"]],[25,[\"buildsChartName\"]]],null]],[12,\"onmouseleave\",[29,\"action\",[[24,0,[]],\"onLegendHoverOut\",[25,[\"buildsChartName\"]]],null]],[9],[0,\"\\n          \"],[1,[24,4,[\"name\"]],false],[0,\" \"],[7,\"a\"],[9],[0,\"only\"],[10],[0,\"\\n        \"],[10],[0,\"\\n\"]],\"parameters\":[4]},null],[0,\"    \"],[10],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"y-axis-label\"],[9],[0,\"TIME (MIN)\"],[10],[0,\"\\n    \"],[1,[29,\"chart-c3\",null,[[\"name\",\"data\",\"axis\",\"grid\",\"interaction\",\"bar\",\"legend\",\"tooltip\",\"subchart\",\"point\",\"size\",\"transition\",\"color\",\"padding\",\"zoom\",\"onrendered\",\"onresized\",\"oninit\"],[[25,[\"buildsChartName\"]],[25,[\"buildMetrics\"]],[25,[\"eventsAxis\"]],[25,[\"grid\"]],[25,[\"interaction\"]],[25,[\"bar\"]],[25,[\"legend\"]],[25,[\"tooltip\"]],[25,[\"subchart\"]],[25,[\"point\"]],[25,[\"size\"]],[25,[\"transition\"]],[25,[\"color\"]],[25,[\"padding\"]],[25,[\"zoom\"]],[25,[\"onrendered\"]],[25,[\"onresized\"]],[29,\"get\",[[25,[\"onInitFns\"]],[25,[\"buildsChartName\"]]],null]]]],false],[0,\"\\n    \"],[7,\"p\"],[11,\"class\",\"reset-button\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"resetZoom\",[25,[\"buildsChartName\"]],[25,[\"eventsChartName\"]]],null]],[11,\"title\",\"Reset Zoom Level\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n  \"],[10],[0,\"\\n\\n\"],[4,\"if\",[[25,[\"metrics\",\"stepGroup\"]]],null,{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"chart-c3\"],[9],[0,\"\\n      \"],[7,\"p\"],[11,\"class\",\"chart-title\"],[9],[0,\"\\n        Step Breakdown Per Build\\n        \"],[7,\"div\"],[11,\"class\",\"job-selector\"],[9],[0,\"\\n          \"],[7,\"select\"],[12,\"onchange\",[29,\"action\",[[24,0,[]],\"selectJob\"],[[\"value\"],[\"target.value\"]]]],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"jobs\"]]],null,{\"statements\":[[4,\"if\",[[29,\"eq\",[[24,3,[]],[25,[\"selectedJobName\"]]],null]],null,{\"statements\":[[0,\"                \"],[7,\"option\"],[12,\"value\",[24,3,[]]],[11,\"selected\",\"selected\"],[9],[1,[24,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                \"],[7,\"option\"],[12,\"value\",[24,3,[]]],[9],[1,[24,3,[]],false],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[3]},null],[0,\"          \"],[10],[0,\"\\n          \"],[7,\"span\"],[11,\"class\",\"control-icon\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n        \"],[10],[0,\"\\n      \"],[10],[0,\"\\n      \"],[7,\"ul\"],[11,\"class\",\"list-inline chart-legend\"],[9],[0,\"\\n\"],[4,\"each\",[[25,[\"stepLegend\"]]],null,{\"statements\":[[0,\"          \"],[7,\"li\"],[12,\"style\",[24,2,[\"style\"]]],[12,\"onclick\",[29,\"action\",[[24,0,[]],\"onLegendClick\",[24,2,[\"key\"]],[25,[\"stepsChartName\"]]],null]],[12,\"onmouseenter\",[29,\"action\",[[24,0,[]],\"onLegendHover\",[24,2,[\"key\"]],[25,[\"stepsChartName\"]]],null]],[12,\"onmouseleave\",[29,\"action\",[[24,0,[]],\"onLegendHoverOut\",[25,[\"stepsChartName\"]]],null]],[9],[0,\"\\n            \"],[1,[24,2,[\"name\"]],false],[0,\" \"],[7,\"a\"],[9],[0,\"only\"],[10],[0,\"\\n          \"],[10],[0,\"\\n\"]],\"parameters\":[2]},null],[0,\"      \"],[10],[0,\"\\n      \"],[7,\"p\"],[11,\"class\",\"y-axis-label\"],[9],[0,\"TIME (MIN)\"],[10],[0,\"\\n      \"],[1,[29,\"chart-c3\",null,[[\"name\",\"data\",\"axis\",\"grid\",\"interaction\",\"bar\",\"legend\",\"tooltip\",\"subchart\",\"point\",\"size\",\"transition\",\"color\",\"padding\",\"zoom\",\"onrendered\",\"onresized\",\"oninit\"],[[25,[\"stepsChartName\"]],[25,[\"stepMetrics\"]],[25,[\"stepsAxis\"]],[25,[\"grid\"]],[25,[\"interaction\"]],[25,[\"bar\"]],[25,[\"legend\"]],[25,[\"tooltip\"]],[25,[\"subchart\"]],[25,[\"point\"]],[25,[\"size\"]],[25,[\"transition\"]],[25,[\"color\"]],[25,[\"padding\"]],[25,[\"zoom\"]],[25,[\"onrendered\"]],[25,[\"onresized\"]],[29,\"get\",[[25,[\"onInitFns\"]],[25,[\"stepsChartName\"]]],null]]]],false],[0,\"\\n      \"],[7,\"p\"],[11,\"class\",\"reset-button\"],[12,\"onClick\",[29,\"action\",[[24,0,[]],\"resetZoom\",[25,[\"stepsChartName\"]]],null]],[11,\"title\",\"Reset Zoom Level\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-refresh\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[7,\"div\"],[11,\"class\",\"chart-cta\"],[9],[0,\"\\n      Please select a job below to see step breakdown per build\\n      \"],[7,\"br\"],[9],[10],[7,\"br\"],[9],[10],[0,\"\\n      \"],[7,\"div\"],[11,\"class\",\"job-selector\"],[9],[0,\"\\n        \"],[7,\"select\"],[12,\"onchange\",[29,\"action\",[[24,0,[]],\"selectJob\"],[[\"value\"],[\"target.value\"]]]],[9],[0,\"\\n          \"],[7,\"option\"],[11,\"value\",\"\"],[9],[0,\"Select a job\"],[10],[0,\"\\n\"],[4,\"each\",[[25,[\"jobs\"]]],null,{\"statements\":[[0,\"            \"],[7,\"option\"],[12,\"value\",[24,1,[]]],[9],[1,[24,1,[]],false],[10],[0,\"\\n\"]],\"parameters\":[1]},null],[0,\"        \"],[10],[0,\"\\n        \"],[7,\"span\"],[11,\"class\",\"control-icon\"],[9],[7,\"i\"],[11,\"class\",\"fa fa-caret-down\"],[11,\"aria-hidden\",\"true\"],[9],[10],[10],[0,\"\\n      \"],[10],[0,\"\\n    \"],[10],[0,\"\\n\"]],\"parameters\":[]}]],\"parameters\":[]},{\"statements\":[[0,\"  \"],[7,\"div\"],[11,\"class\",\"chart-cta\"],[9],[0,\"No metric available for the chosen time range!\"],[10],[0,\"\\n\"]],\"parameters\":[]}],[0,\"\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/metrics/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    admins: _emberData.default.attr(),
    annotations: _emberData.default.attr(),
    checkoutUrl: _emberData.default.attr('string'),
    rootDir: _emberData.default.attr('string'),
    scmContext: _emberData.default.attr('string'),
    createTime: _emberData.default.attr('date'),
    scmRepo: _emberData.default.attr(),
    scmUri: _emberData.default.attr('string'),
    name: _emberData.default.attr('string'),
    workflowGraph: _emberData.default.attr(),
    configPipelineId: _emberData.default.attr('string'),
    childPipelines: _emberData.default.attr(),
    prChain: _emberData.default.attr('boolean', {
      defaultValue: false
    }),
    jobs: _emberData.default.hasMany('job', {
      async: true
    }),
    secrets: _emberData.default.hasMany('secret', {
      async: true
    }),
    tokens: _emberData.default.hasMany('token', {
      async: true
    }),
    metrics: _emberData.default.hasMany('metric', {
      async: true
    }),
    appId: Ember.computed.alias('scmRepo.name'),
    branch: Ember.computed('scmRepo.{branch,rootDir}', {
      get() {
        let {
          branch,
          rootDir
        } = this.scmRepo || {};

        if (rootDir) {
          branch = "".concat(branch, "#").concat(rootDir);
        }

        return branch;
      }

    }),
    hubUrl: Ember.computed.alias('scmRepo.url')
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/options/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service(),
    errorMessage: '',
    isSaving: false,
    pipeline: Ember.computed.reads('model.pipeline'),
    jobs: Ember.computed.reads('model.jobs'),
    actions: {
      setJobStatus(id, state, stateChanger, stateChangeMessage) {
        const job = this.store.peekRecord('job', id);
        job.set('state', state);
        job.set('stateChanger', stateChanger);
        job.set('stateChangeMessage', stateChangeMessage);
        job.set('stateChangeTime', new Date());
        job.save().catch(error => this.set('errorMessage', error.errors[0].detail || ''));
      },

      removePipeline() {
        this.pipeline.destroyRecord().then(() => {
          this.transitionToRoute('home');
        }).catch(error => this.set('errorMessage', error.errors[0].detail || ''));
      },

      updatePipeline({
        scmUrl,
        rootDir
      }) {
        let {
          pipeline
        } = this;
        pipeline.set('checkoutUrl', scmUrl);
        pipeline.set('rootDir', rootDir);
        this.set('isSaving', true);
        pipeline.save().then(() => this.set('errorMessage', '')).catch(err => {
          this.set('errorMessage', err.errors[0].detail || '');
        }).finally(() => {
          this.set('isSaving', false);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/options/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    session: Ember.inject.service(),
    routeAfterAuthentication: 'pipeline.options',

    model() {
      // Guests should not access this page
      if (Ember.get(this, 'session.data.authenticated.isGuest')) {
        this.transitionTo('pipeline');
      }

      const {
        pipeline
      } = this.modelFor('pipeline'); // Prevent double render when jobs list updates asynchronously

      return pipeline.get('jobs').then(jobs => ({
        pipeline,
        jobs
      }));
    },

    actions: {
      willTransition() {
        // Reset error message when switching pages
        this.controller.set('errorMessage', '');
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/options/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "2gVsuxLY",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipeline\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[1,[29,\"pipeline-options\",null,[[\"username\",\"pipeline\",\"jobs\",\"errorMessage\",\"setJobStatus\",\"onRemovePipeline\",\"isSaving\",\"onUpdatePipeline\"],[[25,[\"session\",\"data\",\"authenticated\",\"username\"]],[25,[\"pipeline\"]],[25,[\"jobs\"]],[25,[\"errorMessage\"]],[29,\"action\",[[24,0,[]],\"setJobStatus\"],null],[29,\"action\",[[24,0,[]],\"removePipeline\"],null],[25,[\"isSaving\"]],[29,\"action\",[[24,0,[]],\"updatePipeline\"],null]]]],false],[0,\"\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/options/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/pulls/route", ["exports", "screwdriver-ui/pipeline/events/route"], function (_exports, _route) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _route.default.extend({
    controllerName: 'pipeline.events',

    setupController(controller, model) {
      this._super(controller, model);

      controller.set('activeTab', 'pulls');
    },

    renderTemplate() {
      this.render('pipeline.events');
    },

    model() {
      this.controllerFor('pipeline.events').set('pipeline', this.pipeline);
      const jobsPromise = this.get('pipeline.jobs');
      let events = []; // fetch latest events which belongs to each PR jobs, if the prChain feature is enabled

      if (this.get('pipeline.prChain')) {
        // extracts prNumers, the name of PR jobs starts with `PR-$prNum:`
        const prNumbers = jobsPromise.then(jobs => jobs.filter(job => job.get('isPR')).map(job => job.get('name')).map(jobName => parseInt(jobName.slice('PR-'.length), 10)).reduce((prNums, prNum) => {
          if (prNums.includes(prNum)) {
            return prNums;
          }

          return prNums.concat(prNum);
        }, [])); // iterate to fetch latest PR event which belongs to each PRs

        events = prNumbers.then(prNums => Promise.all(prNums.map(prNum => this.store.query('event', {
          pipelineId: this.get('pipeline.id'),
          page: 1,
          count: 1,
          prNum
        }))).then(queryReults => {
          // merge PR events from separate query results
          const prEvents = Ember.A();
          queryReults.forEach(prEvent => {
            prEvents.pushObjects(prEvent.toArray());
          });
          return prEvents;
        }));
      }

      return Ember.RSVP.hash({
        jobs: jobsPromise,
        events
      });
    },

    actions: {
      refreshModel: function refreshModel() {
        return this.pipeline.hasMany('jobs').reload().then(() => this.refresh());
      }
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    routeAfterAuthentication: 'pipeline',

    model(params) {
      Ember.set(this, 'pipelineId', params.pipeline_id);
      const collections = this.store.findAll('collection').catch(() => []);
      return Ember.RSVP.hash({
        pipeline: this.store.findRecord('pipeline', params.pipeline_id).catch(() => []),
        collections
      });
    },

    actions: {
      error(error) {
        if (error && Array.isArray(error.errors) && error.errors[0].status === 404) {
          this.transitionTo('/404');
        }

        return true;
      }

    },

    titleToken(model) {
      return Ember.get(model, 'pipeline.name');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/secrets/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service(),
    errorMessage: '',
    pipeline: Ember.computed.reads('model.pipeline'),
    secrets: Ember.computed.reads('model.secrets'),
    pipelineTokens: Ember.computed.reads('model.tokens'),
    pipelineId: Ember.computed.reads('model.pipeline.id'),
    newToken: null,
    refreshService: Ember.inject.service('pipeline.secrets'),
    actions: {
      createSecret(name, value, pipelineId, allowInPR) {
        const newSecret = this.store.createRecord('secret', {
          name,
          value,
          pipelineId,
          allowInPR
        });
        return newSecret.save().then(s => {
          this.set('errorMessage', '');
          this.secrets.reload();
          return s;
        }, err => {
          this.set('errorMessage', err.errors[0].detail);
        });
      },

      createPipelineToken(name, description) {
        const newToken = this.store.createRecord('token', {
          name,
          description: description || '',
          action: 'created'
        });
        return newToken.save({
          adapterOptions: {
            pipelineId: this.pipelineId
          }
        }).then(token => {
          this.set('newToken', token);
        }, error => {
          newToken.destroyRecord({
            adapterOptions: {
              pipelineId: this.pipelineId
            }
          });
          throw error;
        });
      },

      refreshPipelineToken(tokenId) {
        return this.refreshService.refreshPipelineToken(this.pipelineId, tokenId).then(token => {
          this.set('newToken', token);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/secrets/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    session: Ember.inject.service(),
    routeAfterAuthentication: 'pipeline.secrets',
    titleToken: 'Secrets',

    model() {
      // Guests should not access this page
      if (Ember.get(this, 'session.data.authenticated.isGuest')) {
        this.transitionTo('pipeline');
      }

      const {
        pipeline
      } = this.modelFor('pipeline');
      const secrets = pipeline.get('secrets');
      this.store.unloadAll('token');
      return this.store.findAll('token', {
        adapterOptions: {
          pipelineId: pipeline.get('id')
        }
      }).then(tokens => ({
        tokens,
        secrets,
        pipeline
      }));
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/secrets/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    refreshPipelineToken(pipelineId, tokenId) {
      const token = Ember.get(this, 'session.data.authenticated.token');
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url: "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(pipelineId, "/tokens/").concat(tokenId, "/refresh"),
          method: 'PUT',
          headers: {
            Authorization: "Bearer ".concat(token)
          },
          crossDomain: true,
          xhrFields: {
            withCredentials: true
          }
        }).done(content => resolve(Object.assign(content, {
          action: 'refreshed'
        }))).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON) {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/secrets/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "M+EA/DZ3",
    "block": "{\"symbols\":[],\"statements\":[[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"  \"],[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipeline\"]]]]],false],[0,\"\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[29,\"pipeline-secret-settings\",null,[[\"secrets\",\"onCreateSecret\",\"pipeline\",\"errorMessage\"],[[25,[\"secrets\"]],[29,\"action\",[[24,0,[]],\"createSecret\"],null],[25,[\"pipeline\"]],[25,[\"errorMessage\"]]]]],false],[0,\"\\n\\n\"],[1,[29,\"token-list\",null,[[\"tokens\",\"newToken\",\"pipelineId\",\"onCreateToken\",\"onRefreshToken\",\"tokenName\",\"tokenScope\"],[[25,[\"pipelineTokens\"]],[25,[\"newToken\"]],[25,[\"pipelineId\"]],[29,\"action\",[[24,0,[]],\"createPipelineToken\"],null],[29,\"action\",[[24,0,[]],\"refreshPipelineToken\"],null],\"Pipeline\",\"this pipeline\"]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/secrets/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    /**
     * Override the serializeIntoHash
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      return Ember.assign(hash, {
        checkoutUrl: snapshot.attr('checkoutUrl'),
        rootDir: snapshot.attr('rootDir') || ''
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/pipeline/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "bVqaCkrz",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-header\",null,[[\"pipeline\",\"collections\",\"addToCollection\"],[[25,[\"pipeline\"]],[25,[\"collections\"]],[29,\"action\",[[24,0,[]],\"addToCollection\"],null]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/pipeline/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/pr-events/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    /**
     * Calls the events api and filters based on type prs
     * @method getPRevents
     * @param  {String}  pipelineId           id of pipeline
     * @param  {String}  eventPrUrl           url of PR
     * @return {Promise}                      Resolves to prCommit
     */
    getPRevents(pipelineId, eventPrUrl, jobId) {
      const eventUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/pipelines/").concat(pipelineId, "/events");
      const buildUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/jobs/").concat(jobId, "/builds");
      const prNum = eventPrUrl.split('/').pop();
      let buildPromise = new Ember.RSVP.Promise(resolve => _jquery.default.ajax({
        method: 'GET',
        url: buildUrl,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
        }
      }).done(data => {
        resolve(data);
      }));
      let eventPromise = new Ember.RSVP.Promise(resolve => _jquery.default.ajax({
        method: 'GET',
        url: eventUrl,
        data: {
          type: 'pr',
          prNum
        },
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(this.session.get('data.authenticated.token'))
        }
      }).done(data => {
        resolve(data);
      }).catch(() => resolve([])));
      let promises = [buildPromise, eventPromise];
      return new Ember.RSVP.Promise(resolve => Ember.RSVP.allSettled(promises).then(array => {
        const builds = array[0].value;
        const prCommits = array[1].value;
        let eventBuildPairs = [];
        prCommits.forEach(commit => {
          const matchingBuild = builds.find(build => build.eventId === commit.id);

          if (matchingBuild) {
            eventBuildPairs.push({
              event: commit,
              build: matchingBuild
            });
          }
        });
        resolve(eventBuildPairs);
      }));
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/resolver", ["exports", "ember-resolver"], function (_exports, _emberResolver) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _emberResolver.default;
  _exports.default = _default;
});
;define("screwdriver-ui/router", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const Router = Ember.Router.extend({
    location: _environment.default.locationType,
    rootURL: _environment.default.rootURL
  }); // This isn't really an array method, but eslint thinks it is

  /* eslint-disable array-callback-return */

  Router.map(function route() {
    this.route('home', {
      path: '/'
    });
    this.route('builds', {
      path: '/builds/:build_id'
    });
    this.route('pipeline', {
      path: '/pipelines/:pipeline_id'
    }, function secretsRoute() {
      this.route('events');
      this.route('secrets');
      this.route('build', {
        path: 'builds/:build_id'
      }, function stepsRoute() {
        this.route('step', {
          path: 'steps/:step_id'
        });
      });
      this.route('options');
      this.route('child-pipelines');
      this.route('pulls');
      this.route('metrics');
    });
    this.route('login');
    this.route('create');
    this.route('page-not-found', {
      path: '/*path'
    });
    this.route('search');
    this.route('user-settings');
    this.route('validator');
    this.route('dashboard', {
      path: '/dashboards/'
    }, function dashboardsRoute() {
      this.route('show', {
        path: '/:collection_id'
      });
    });
    this.route('templates', function templatesRoute() {
      this.route('namespace', {
        path: '/:namespace'
      });
      this.route('detail', {
        path: '/:namespace/:name'
      });
    });
    this.route('commands', function commandsRoute() {
      this.route('namespace', {
        path: '/:namespace'
      });
      this.route('detail', {
        path: '/:namespace/:name'
      });
    });
    this.route('404', {
      path: '/*path'
    });
  });
  /* eslint-enable array-callback-return */

  var _default = Router;
  _exports.default = _default;
});
;define("screwdriver-ui/routes/application", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    Route
  } = Ember; // Ensure the application route exists for ember-simple-auth's `setup-session-restoration` initializer

  var _default = Route.extend();

  _exports.default = _default;
});
;define("screwdriver-ui/scm/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    context: _emberData.default.attr('string'),
    displayName: _emberData.default.attr('string'),
    iconType: _emberData.default.attr('string'),
    isSignedIn: _emberData.default.attr('boolean', {
      defaultValue: false
    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/scm/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const scmUrl = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/auth/contexts");
  /**
   * Get scm icon type.
   * @method getIconType
   * @param  {String}  scmContext  scmContext (e.g. github:github.com)
   * @return {String}  iconType (using Font Awesome Icons)
   */

  function getIconType(scmContext) {
    const iconTypes = {
      github: 'github',
      bitbucket: 'bitbucket',
      gitlab: 'gitlab'
    };
    const [scm] = scmContext.split(':');
    return iconTypes[scm];
  }

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),
    store: Ember.inject.service(),

    /**
     * Get all scms from sd api server,
     * and create record into ember data.
     * @method createScms
     * @return {DS.RecordArray} Array of scm object.
     */
    createScms() {
      const {
        session,
        store
      } = this;
      const scms = this.getScms();

      if (Ember.get(scms, 'length') !== 0) {
        return scms;
      }

      return _jquery.default.getJSON(scmUrl).then(scmContexts => {
        scmContexts.forEach(scmContext => {
          let isSignedIn = false;

          if (Ember.get(session, 'isAuthenticated')) {
            const jwtContext = Ember.get(session, 'data.authenticated.scmContext');

            if (jwtContext === scmContext.context) {
              isSignedIn = true;
            }
          } // Create ember data of scm info


          store.createRecord('scm', {
            context: scmContext.context,
            displayName: scmContext.displayName,
            iconType: getIconType(scmContext.context),
            isSignedIn
          });
        });
        return store.peekAll('scm');
      }).catch(() => []);
    },

    /**
     * Get all scm object from inner ember data table.
     * @method getScms
     * @return {DS.RecordArray} Array of scm object.
     */
    getScms() {
      return this.store.peekAll('scm');
    },

    /**
     * Get specific scm object from inner ember data table.
     * @method getScm
     * @param  {String}  scmContext  scmContext (e.g. github:github.com)
     * @return {Object}              scm object
     */
    getScm(scmContext) {
      let ret = {};
      this.getScms().forEach(scm => {
        if (scm.get('context') === scmContext) {
          ret = {
            context: scm.get('context'),
            displayName: scm.get('displayName'),
            iconType: getIconType(scmContext)
          };
        }
      });
      return ret;
    },

    /**
     * Change status of 'isSignedIn' property true.
     * @method setSignedIn
     * @param  {String}  scmContext  scmContext (e.g. github:github.com)
     */
    setSignedIn(scmContext) {
      this.getScms().forEach(scm => {
        if (scm.get('context') === scmContext) {
          scm.set('isSignedIn', true);
        } else {
          scm.set('isSignedIn', false);
        }
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/search/controller", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    session: Ember.inject.service(),
    moreToShow: true,
    modelPipelines: Ember.computed('model.pipelines', {
      get() {
        const currentModelPipelines = this.get('model.pipelines').toArray();
        const currentPipelinesShown = this.pipelinesToShow;

        if (Array.isArray(currentPipelinesShown) && currentPipelinesShown.length) {
          this.set('pipelinesToShow', []);
        }

        return [].concat(currentModelPipelines);
      }

    }),
    pipelines: Ember.computed('modelPipelines', 'pipelinesToShow', {
      get() {
        return [].concat(this.modelPipelines, this.pipelinesToShow);
      }

    }),
    collections: Ember.computed.reads('model.collections'),
    query: Ember.computed.reads('model.query'),
    editingDescription: false,
    editingName: false,

    init() {
      this._super(...arguments);

      this.set('pipelinesToShow', []);
    },

    actions: {
      updatePipelines({
        page,
        search
      }) {
        const pipelineListConfig = {
          page,
          count: _environment.default.APP.NUM_PIPELINES_LISTED,
          sortBy: 'name',
          sort: 'ascending'
        };

        if (search) {
          pipelineListConfig.search = search;
          this.setProperties({
            query: search
          });
        }

        return this.store.query('pipeline', pipelineListConfig).then(pipelines => {
          const nextPipelines = pipelines.toArray();

          if (Array.isArray(nextPipelines)) {
            if (nextPipelines.length < _environment.default.APP.NUM_PIPELINES_LISTED) {
              this.set('moreToShow', false);
            }

            this.set('pipelinesToShow', this.pipelinesToShow.concat(nextPipelines));
          }
        });
      },

      /**
       * Adding a pipeline to a collection
       * @param {Number} pipelineId - id of pipeline to add to collection
       * @param {Object} collection - collection object
       */
      addToCollection(pipelineId, collectionId) {
        return this.store.findRecord('collection', collectionId).then(collection => {
          const pipelineIds = collection.get('pipelineIds');

          if (!pipelineIds.includes(pipelineId)) {
            collection.set('pipelineIds', [...pipelineIds, pipelineId]);
          }

          return collection.save();
        });
      },

      changeCollection() {
        this.set('editingDescription', false);
        this.set('editingName', false);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/search/route", ["exports", "screwdriver-ui/config/environment", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _environment, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    queryParams: {
      query: {
        refreshModel: true,
        replace: true
      }
    },
    routeAfterAuthentication: 'search',
    titleToken: 'Search',

    model(params) {
      const pipelineListConfig = {
        page: 1,
        count: _environment.default.APP.NUM_PIPELINES_LISTED,
        sortBy: 'name',
        sort: 'ascending'
      };

      if (params && params.query) {
        pipelineListConfig.search = params.query;
      }

      return Ember.RSVP.hash({
        pipelines: this.store.query('pipeline', pipelineListConfig),
        collections: this.store.findAll('collection').catch(() => []),
        query: params.query
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/search/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "s6dKocbG",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n\"],[4,\"if\",[[25,[\"session\",\"isAuthenticated\"]]],null,{\"statements\":[[0,\"    \"],[1,[29,\"collections-flyout\",null,[[\"changeCollection\",\"class\"],[[29,\"action\",[[24,0,[]],\"changeCollection\"],null],\"col-md-2\"]]],false],[0,\"\\n    \"],[1,[29,\"search-list\",null,[[\"moreToShow\",\"pipelines\",\"updatePipelines\",\"collections\",\"addToCollection\",\"query\",\"class\"],[[25,[\"moreToShow\"]],[25,[\"pipelines\"]],[29,\"action\",[[24,0,[]],\"updatePipelines\"],null],[25,[\"collections\"]],[29,\"action\",[[24,0,[]],\"addToCollection\"],null],[25,[\"query\"]],\"col-md-10\"]]],false],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"    \"],[1,[29,\"search-list\",null,[[\"moreToShow\",\"pipelines\",\"updatePipelines\",\"collections\",\"addToCollection\",\"query\",\"name\",\"description\",\"errorMessage\",\"addNewCollection\"],[[25,[\"moreToShow\"]],[25,[\"pipelines\"]],[29,\"action\",[[24,0,[]],\"updatePipelines\"],null],[25,[\"collections\"]],[29,\"action\",[[24,0,[]],\"addToCollection\"],null],[25,[\"query\"]],[25,[\"name\"]],[25,[\"description\"]],[25,[\"errorMessage\"]],[29,\"action\",[[24,0,[]],\"addNewCollection\"],null]]]],false],[0,\"\\n\"]],\"parameters\":[]}],[10],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/search/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/secret/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    pipelineId: _emberData.default.attr('string'),
    // DS.belongsTo('pipeline'),
    name: _emberData.default.attr('string'),
    value: _emberData.default.attr('string'),
    allowInPR: _emberData.default.attr('boolean', {
      defaultValue: false
    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/secret/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    /**
     * Override the serializeIntoHash method because our screwed up API doesn't have model names as a root key
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot, options) {
      if (!snapshot.id) {
        return Ember.assign(hash, this.serialize(snapshot, options));
      }

      const dirty = snapshot.changedAttributes();
      Object.keys(dirty).forEach(key => {
        dirty[key] = dirty[key][1];
      });
      return Ember.assign(hash, dirty);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/services/-gestures", ["exports", "screwdriver-ui/config/environment", "ember-gestures/services/-gestures"], function (_exports, _environment, _gestures) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const assign = Ember.assign || Ember.merge;
  let gestures = assign({}, {
    useCapture: false
  });
  gestures = assign(gestures, _environment.default.gestures);

  var _default = _gestures.default.extend({
    useCapture: gestures.useCapture
  });

  _exports.default = _default;
});
;define("screwdriver-ui/services/-in-viewport", ["exports", "ember-in-viewport/services/-in-viewport"], function (_exports, _inViewport) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _inViewport.default;
    }
  });
});
;define("screwdriver-ui/services/ajax", ["exports", "ember-ajax/services/ajax"], function (_exports, _ajax) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _ajax.default;
    }
  });
});
;define("screwdriver-ui/services/cookies", ["exports", "ember-cookies/services/cookies"], function (_exports, _cookies) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _cookies.default;
  _exports.default = _default;
});
;define("screwdriver-ui/services/media", ["exports", "ember-responsive/services/media"], function (_exports, _media) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _media.default;
  _exports.default = _default;
});
;define("screwdriver-ui/services/modal-dialog", ["exports", "screwdriver-ui/config/environment"], function (_exports, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  function computedFromConfig(prop) {
    return Ember.computed(function () {
      return _environment.default['ember-modal-dialog'] && _environment.default['ember-modal-dialog'][prop];
    });
  }

  var _default = Ember.Service.extend({
    hasEmberTether: computedFromConfig('hasEmberTether'),
    hasLiquidWormhole: computedFromConfig('hasLiquidWormhole'),
    hasLiquidTether: computedFromConfig('hasLiquidTether'),
    destinationElementId: null // injected by initializer

  });

  _exports.default = _default;
});
;define("screwdriver-ui/services/moment", ["exports", "ember-moment/services/moment", "screwdriver-ui/config/environment"], function (_exports, _moment, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    get
  } = Ember;

  var _default = _moment.default.extend({
    defaultFormat: get(_environment.default, 'moment.outputFormat')
  });

  _exports.default = _default;
});
;define("screwdriver-ui/services/resize-detector", ["exports", "ember-element-resize-detector/services/resize-detector"], function (_exports, _resizeDetector) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _resizeDetector.default;
    }
  });
});
;define("screwdriver-ui/services/scrollbar-thickness", ["exports", "ember-scrollable/services/scrollbar-thickness"], function (_exports, _scrollbarThickness) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _scrollbarThickness.default;
    }
  });
});
;define("screwdriver-ui/services/session", ["exports", "ember-simple-auth/services/session"], function (_exports, _session) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = _session.default;
  _exports.default = _default;
});
;define("screwdriver-ui/session-stores/application", ["exports", "ember-simple-auth/session-stores/adaptive"], function (_exports, _adaptive) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _adaptive.default.extend();

  _exports.default = _default;
});
;define("screwdriver-ui/store/service", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Store.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/svgs", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  var _default = {
    "Screwdriver_Icon_Full": "<svg data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 150 150\"><defs><linearGradient id=\"a\" x1=\"55.37\" y1=\"5\" x2=\"55.37\" y2=\"105.73\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#2980c3\"/><stop offset=\".5\" stop-color=\"#0d72b9\"/><stop offset=\"1\" stop-color=\"#0a5287\"/></linearGradient><linearGradient id=\"b\" x1=\"94.63\" y1=\"145\" x2=\"94.63\" y2=\"44.27\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#2980c3\"/><stop offset=\".7\" stop-color=\"#0d72b9\"/><stop offset=\"1\" stop-color=\"#0a5287\"/></linearGradient></defs><path d=\"M104.72 45.28a50.37 50.37 0 1 0-59.43 59.43 50.41 50.41 0 0 1-1-10.08V83.08a29.83 29.83 0 1 1 41-27.72v29.88H64.76v9.39a29.69 29.69 0 0 0 2.16 11.1h38.81V55.37a50.41 50.41 0 0 0-1.01-10.09z\" fill=\"url(#a)\"/><path d=\"M104.72 45.28a50.41 50.41 0 0 1 1 10.08v11.56a29.83 29.83 0 1 1-41 27.72V64.76h20.52v-9.39a29.69 29.69 0 0 0-2.16-11.1H44.27v50.36a50.37 50.37 0 1 0 60.45-49.35z\" fill=\"url(#b)\"/></svg>",
    "Screwdriver_Icon_White": "<svg data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 150 150\"><path d=\"M113 47.73a58.42 58.42 0 0 1 .52 7.63v16.16a29.84 29.84 0 1 1-42 42 29.87 29.87 0 0 1-4.61-7.78 29.69 29.69 0 0 1-2.16-11.1V64.76h12.72v-9.39a21.9 21.9 0 0 0-1.6-8.2 22.58 22.58 0 0 0-1.42-2.9H44.27v50.36a50.41 50.41 0 0 0 1 10.08q.43 2.12 1 4.18c.43 1.45.93 2.88 1.48 4.27A50.36 50.36 0 1 0 113 47.73z\" fill=\"#fff\"/><path d=\"M104.72 45.28q-.43-2.12-1-4.18c-.43-1.45-.93-2.88-1.48-4.27A50.36 50.36 0 1 0 37 102.27a58.44 58.44 0 0 1-.52-7.63V78.48a29.83 29.83 0 1 1 48.76-23.11v29.87H72.53v9.39a21.89 21.89 0 0 0 1.6 8.2 22.58 22.58 0 0 0 1.42 2.9h30.17V55.37a50.41 50.41 0 0 0-1-10.09z\" fill=\"#fff\"/></svg>",
    "Screwdriver_Logo_FullWhite": "<svg data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 923.72 150\"><defs><linearGradient id=\"a\" x1=\"55.37\" y1=\"5\" x2=\"55.37\" y2=\"105.73\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#2980c3\"/><stop offset=\".5\" stop-color=\"#0d72b9\"/><stop offset=\"1\" stop-color=\"#0a5287\"/></linearGradient><linearGradient id=\"b\" x1=\"94.63\" y1=\"145\" x2=\"94.63\" y2=\"44.27\" gradientUnits=\"userSpaceOnUse\"><stop offset=\"0\" stop-color=\"#2980c3\"/><stop offset=\".7\" stop-color=\"#0d72b9\"/><stop offset=\"1\" stop-color=\"#0a5287\"/></linearGradient></defs><path d=\"M104.72 45.28a50.37 50.37 0 1 0-59.43 59.43 50.41 50.41 0 0 1-1-10.08V83.08a29.83 29.83 0 1 1 41-27.72v29.88H64.76v9.39a29.69 29.69 0 0 0 2.16 11.1h38.81V55.37a50.41 50.41 0 0 0-1.01-10.09z\" fill=\"url(#a)\"/><path d=\"M104.72 45.28a50.41 50.41 0 0 1 1 10.08v11.56a29.83 29.83 0 1 1-41 27.72V64.76h20.52v-9.39a29.69 29.69 0 0 0-2.16-11.1H44.27v50.36a50.37 50.37 0 1 0 60.45-49.35z\" fill=\"url(#b)\"/><path d=\"M186.31 93.07c.78 6.67 7.73 11 16.7 11s15.18-4.31 15.18-10.25c0-5.27-3.87-8.18-13.62-10.37L194 81.19c-14.9-3.19-22.24-10.76-22.24-22.58 0-14.9 12.89-24.77 30.93-24.77 18.83 0 30.65 9.69 30.93 24.32H217.8c-.56-6.84-6.56-11-15-11s-14 4-14 10c0 5 3.92 7.79 13.22 9.92l9.81 2.07c16.19 3.47 23.25 10.42 23.25 22.75 0 15.69-12.72 25.61-32.78 25.61-19.44 0-31.83-9.25-32.33-24.43zM281.89 78.39c-.84-6.28-5.15-10.59-11.93-10.59-8 0-13.06 6.84-13.06 18.21 0 11.6 5 18.32 13.11 18.32 6.61 0 10.93-3.7 11.88-10.25h15.24c-.9 14.12-11.37 23.08-27.29 23.08-18 0-29.53-11.77-29.53-31.15 0-19.05 11.49-31 29.42-31 16.25 0 26.62 9.86 27.34 23.42zM303.81 56h15.8v10.85h.34c2.05-7.45 7.22-11.55 14.28-11.55a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.39h-16.35zM398.33 97.72c-1.79 11.71-12.66 19.44-27.4 19.44-18.38 0-29.59-11.71-29.59-30.82S352.61 55 370.32 55c17.43 0 28.52 11.6 28.52 29.86v5h-41.41v1c0 8.46 5.55 14.23 13.78 14.23 5.88 0 10.59-2.8 12.1-7.34zM357.6 79.79h25.49c-.34-7.68-5.38-12.72-12.61-12.72s-12.32 5.21-12.88 12.72zM472 116.1h-17.44l-10.87-42.47h-.34l-10.81 42.47h-17.2L399.37 56h16.47l9.08 44.54h.34L435.9 56h15.69l10.7 44.54h.34L471.76 56h16.14zM487.44 86c0-18.83 9.64-30.65 24.6-30.65 8.69 0 15.35 4.37 18.32 11h.34v-31.1h16.36v80.85h-16.14v-10.31h-.28c-2.91 6.61-9.86 11-18.71 11-14.93.04-24.49-11.84-24.49-30.79zm16.75.11c0 10.81 5.15 17.59 13.28 17.59s13.34-6.84 13.34-17.59-5.21-17.59-13.34-17.59-13.28 6.79-13.28 17.55zM555.69 56h15.8v10.85h.34c2.07-7.45 7.23-11.54 14.29-11.54a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.38h-16.36zM596.08 41a8.75 8.75 0 1 1 8.74 8.46 8.48 8.48 0 0 1-8.74-8.46zm.56 15H613v60.1h-16.36zM657.66 116.1h-18.49L618.38 56h17.54l12.5 45.61h.34L661.19 56h17.09zM733.57 97.72c-1.79 11.71-12.66 19.44-27.4 19.44-18.38 0-29.59-11.71-29.59-30.82S687.85 55 705.55 55c17.43 0 28.52 11.6 28.52 29.86v5h-41.4v1c0 8.46 5.55 14.23 13.78 14.23 5.88 0 10.59-2.8 12.1-7.34zm-40.74-17.93h25.49c-.34-7.68-5.38-12.72-12.61-12.72s-12.32 5.21-12.88 12.72zM741.18 56H757v10.85h.34c2.07-7.45 7.23-11.54 14.29-11.54a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.38h-16.38zM774.09 107.75a9 9 0 1 1 9 9 8.94 8.94 0 0 1-9-9zM838.79 78.39c-.84-6.28-5.15-10.59-11.93-10.59-8 0-13.06 6.84-13.06 18.21 0 11.6 5 18.32 13.11 18.32 6.61 0 10.93-3.7 11.88-10.25H854c-.9 14.12-11.38 23.08-27.29 23.08-18 0-29.53-11.77-29.53-31.15 0-19.05 11.49-31 29.42-31 16.25 0 26.62 9.86 27.34 23.42zM858.1 86c0-18.83 9.64-30.65 24.6-30.65 8.68 0 15.35 4.37 18.32 11h.34v-31.1h16.36v80.85h-16.14v-10.31h-.28c-2.91 6.61-9.86 11-18.72 11-14.9.04-24.48-11.84-24.48-30.79zm16.75.11c0 10.81 5.15 17.59 13.28 17.59s13.34-6.84 13.34-17.59-5.21-17.59-13.34-17.59-13.27 6.79-13.27 17.55z\" fill=\"#fff\"/></svg>",
    "Screwdriver_Logo_White": "<svg data-name=\"Layer 1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 923.72 150\"><path d=\"M186.31 93.07c.78 6.67 7.73 11 16.7 11s15.18-4.31 15.18-10.25c0-5.27-3.87-8.18-13.62-10.37L194 81.19c-14.9-3.19-22.24-10.76-22.24-22.58 0-14.9 12.89-24.77 30.93-24.77 18.83 0 30.65 9.69 30.93 24.32H217.8c-.56-6.84-6.56-11-15-11s-14 4-14 10c0 5 3.92 7.79 13.22 9.92l9.81 2.07c16.19 3.47 23.25 10.42 23.25 22.75 0 15.69-12.72 25.61-32.78 25.61-19.44 0-31.83-9.25-32.33-24.43zM281.89 78.39c-.84-6.28-5.15-10.59-11.93-10.59-8 0-13.06 6.84-13.06 18.21 0 11.6 5 18.32 13.11 18.32 6.61 0 10.93-3.7 11.88-10.25h15.24c-.9 14.12-11.37 23.08-27.29 23.08-18 0-29.53-11.77-29.53-31.15 0-19.05 11.49-31 29.42-31 16.25 0 26.62 9.86 27.34 23.42zM303.81 56h15.8v10.85h.34c2.05-7.45 7.22-11.55 14.28-11.55a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.39h-16.35zM398.33 97.72c-1.79 11.71-12.66 19.44-27.4 19.44-18.38 0-29.59-11.71-29.59-30.82S352.61 55 370.32 55c17.43 0 28.52 11.6 28.52 29.86v5h-41.41v1c0 8.46 5.55 14.23 13.78 14.23 5.88 0 10.59-2.8 12.1-7.34zM357.6 79.79h25.49c-.34-7.68-5.38-12.72-12.61-12.72s-12.32 5.21-12.88 12.72zM472 116.1h-17.44l-10.87-42.47h-.34l-10.81 42.47h-17.2L399.37 56h16.47l9.08 44.54h.34L435.9 56h15.69l10.7 44.54h.34L471.76 56h16.14zM487.44 86c0-18.83 9.64-30.65 24.6-30.65 8.69 0 15.35 4.37 18.32 11h.34v-31.1h16.36v80.85h-16.14v-10.31h-.28c-2.91 6.61-9.86 11-18.71 11-14.93.04-24.49-11.84-24.49-30.79zm16.75.11c0 10.81 5.15 17.59 13.28 17.59s13.34-6.84 13.34-17.59-5.21-17.59-13.34-17.59-13.28 6.79-13.28 17.55zM555.69 56h15.8v10.85h.34c2.07-7.45 7.23-11.54 14.29-11.54a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.38h-16.36zM596.08 41a8.75 8.75 0 1 1 8.74 8.46 8.48 8.48 0 0 1-8.74-8.46zm.56 15H613v60.1h-16.36zM657.66 116.1h-18.49L618.38 56h17.54l12.5 45.61h.34L661.19 56h17.09zM733.57 97.72c-1.79 11.71-12.66 19.44-27.4 19.44-18.38 0-29.59-11.71-29.59-30.82S687.85 55 705.55 55c17.43 0 28.52 11.6 28.52 29.86v5h-41.4v1c0 8.46 5.55 14.23 13.78 14.23 5.88 0 10.59-2.8 12.1-7.34zm-40.74-17.93h25.49c-.34-7.68-5.38-12.72-12.61-12.72s-12.32 5.21-12.88 12.72zM741.18 56H757v10.85h.34c2.07-7.45 7.23-11.54 14.29-11.54a15.06 15.06 0 0 1 4.65.62v14.4a16.84 16.84 0 0 0-5.94-1c-8.07 0-12.78 4.93-12.78 13.39v33.38h-16.38zM774.09 107.75a9 9 0 1 1 9 9 8.94 8.94 0 0 1-9-9zM838.79 78.39c-.84-6.28-5.15-10.59-11.93-10.59-8 0-13.06 6.84-13.06 18.21 0 11.6 5 18.32 13.11 18.32 6.61 0 10.93-3.7 11.88-10.25H854c-.9 14.12-11.38 23.08-27.29 23.08-18 0-29.53-11.77-29.53-31.15 0-19.05 11.49-31 29.42-31 16.25 0 26.62 9.86 27.34 23.42zM858.1 86c0-18.83 9.64-30.65 24.6-30.65 8.68 0 15.35 4.37 18.32 11h.34v-31.1h16.36v80.85h-16.14v-10.31h-.28c-2.91 6.61-9.86 11-18.72 11-14.9.04-24.48-11.84-24.48-30.79zm16.75.11c0 10.81 5.15 17.59 13.28 17.59s13.34-6.84 13.34-17.59-5.21-17.59-13.34-17.59-13.27 6.79-13.27 17.55zM113 47.73a58.42 58.42 0 0 1 .52 7.63v16.16a29.84 29.84 0 1 1-42 42 29.87 29.87 0 0 1-4.61-7.78 29.69 29.69 0 0 1-2.16-11.1V64.76h12.72v-9.39a21.9 21.9 0 0 0-1.6-8.2 22.58 22.58 0 0 0-1.42-2.9H44.27v50.36a50.41 50.41 0 0 0 1 10.08q.43 2.12 1 4.18c.43 1.45.93 2.88 1.48 4.27A50.36 50.36 0 1 0 113 47.73z\" fill=\"#fff\"/><path d=\"M104.72 45.28q-.43-2.12-1-4.18c-.43-1.45-.93-2.88-1.48-4.27A50.36 50.36 0 1 0 37 102.27a58.44 58.44 0 0 1-.52-7.63V78.48a29.83 29.83 0 1 1 48.76-23.11v29.87H72.53v9.39a21.89 21.89 0 0 0 1.6 8.2 22.58 22.58 0 0 0 1.42 2.9h30.17V55.37a50.41 50.41 0 0 0-1-10.09z\" fill=\"#fff\"/></svg>",
    "add-circle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><g data-name=\"Layer 2\"><g data-name=\"invisible box\" fill=\"none\"><path d=\"M0 0h48v48H0z\"/><path d=\"M0 0h48v48H0z\"/><path d=\"M0 0h48v48H0z\"/></g><g data-name=\"icons Q2\"><path d=\"M24 2a22 22 0 1 0 22 22A21.9 21.9 0 0 0 24 2zm0 40a18 18 0 1 1 18-18 18.1 18.1 0 0 1-18 18z\"/><path d=\"M34 22h-8v-8a2 2 0 0 0-4 0v8h-8a2 2 0 0 0 0 4h8v8a2 2 0 0 0 4 0v-8h8a2 2 0 0 0 0-4z\"/></g></g></svg>",
    "blog": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M30.7 8H17.8C10.3 8 3.6 13.7 3 21.2c-.5 6.7 3.6 12.6 9.5 14.7V43c0 .6.5 1 1 1 .2 0 .4-.1.6-.2l9.6-7.1h6.5c7.3 0 13.8-5.2 14.7-12.5C46 15.5 39.2 8 30.7 8zm0 3.8c3 0 5.9 1.3 7.9 3.6s2.9 5.3 2.5 8.3c-.7 5.2-5.4 9.1-10.9 9.1h-7.8l-6.1 4.5v-4.2l-2.5-.9c-4.5-1.6-7.3-6-7-10.8.4-5.4 5.2-9.7 11-9.7 0 .1 12.9.1 12.9.1z\"/></svg>",
    "community": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M23.8 31.8C21 28.7 16.9 27 12.6 27c-4.2 0-8.2 1.7-11.1 4.7-.8.8-.7 2.1.1 2.8s2.1.7 2.8-.1c2.1-2.2 5.1-3.5 8.2-3.5 3.1 0 6.2 1.3 8.2 3.5.4.4.9.6 1.5.6.5 0 1-.2 1.4-.5.8-.6.8-1.9.1-2.7zM46.5 37.5c-2.8-3.1-6.9-4.8-11.2-4.8-4.2 0-8.2 1.7-11.1 4.7-.8.8-.7 2.1.1 2.8.8.8 2.1.7 2.8-.1 2.1-2.2 5.1-3.5 8.2-3.5 3.1 0 6.2 1.3 8.2 3.5.4.4.9.6 1.5.6.5 0 1-.2 1.4-.5.8-.7.8-1.9.1-2.7zM35.3 28.5c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4.1 9 9 9zm0-14c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5c0-2.7 2.3-5 5-5zM12.7 23c5 0 9-4 9-9s-4-9-9-9-9 4-9 9 4 9 9 9zm0-14c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5z\"/></svg>",
    "create": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M40 28a2 2 0 0 0-2 2v12H10V6h10a2 2 0 0 0 0-4H8a2 2 0 0 0-2 2v40a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2z\"/><path d=\"M45.41 12.08l-9.49-9.49a2 2 0 0 0-2.83 0L14.33 21.35v10.32a2 2 0 0 0 2 2h10.32l18.76-18.76a2 2 0 0 0 0-2.83zM18.33 29.67V23l1.09-1.09 6.66 6.66-1.08 1.1zm10.58-3.92l-6.66-6.66L34.5 6.83l6.66 6.66z\"/></svg>",
    "docs": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M41.41 14.41L29.59 2.59A2 2 0 0 0 28.17 2H8a2 2 0 0 0-2 2v40a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V15.83a2 2 0 0 0-.59-1.42zM38 42H10V6h14v10a4 4 0 0 0 4 4h10zM28 16V6.66L37.34 16z\"/></svg>",
    "documentation": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M41 47H7c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h18.7c.5 0 1 .2 1.4.6l15.3 15.2c.4.4.6.9.6 1.4V45c0 1.1-.9 2-2 2zM23 5H9v38h30V21H25c-1.1 0-2-.9-2-2V5zm4 12h10.3L27 6.7V17z\" fill-rule=\"evenodd\" clip-rule=\"evenodd\"/></svg>",
    "file-text": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><g data-name=\"Layer 2\"><path fill=\"none\" d=\"M0 0h48v48H0z\" data-name=\"invisible box\"/><g data-name=\"icons Q2\"><rect x=\"14\" y=\"14\" width=\"20\" height=\"4\" rx=\"2\" ry=\"2\"/><rect x=\"14\" y=\"22\" width=\"20\" height=\"4\" rx=\"2\" ry=\"2\"/><rect x=\"14\" y=\"30\" width=\"12\" height=\"4\" rx=\"2\" ry=\"2\"/><path d=\"M38 7v34H10V7h28m2-4H8a2 2 0 0 0-2 2v38a2 2 0 0 0 2 2h32a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z\"/></g></g></svg>",
    "github-original": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M24 3C12.4 3 3 12.4 3 24c0 8.7 5.3 16.2 12.9 19.4 2.5 1.1 5.2 1.6 8.1 1.6s5.6-.6 8.1-1.6C39.7 40.2 45 32.7 45 24c0-11.6-9.4-21-21-21zm6.5 36.7c-.5.2-1 .4-1.5.5-.7.1-1-.4-1-.8V35c0-1.5-.5-2.5-1.1-3 3.6-.4 7.4-1.8 7.4-8 0-1.8-.6-3.2-1.7-4.3.2-.4.7-2-.2-4.3 0 0-1.4-.4-4.4 1.7-1.3-.4-2.7-.5-4-.5-1.4 0-2.8.2-4 .5-3.1-2.1-4.4-1.7-4.4-1.7-.9 2.2-.3 3.9-.2 4.3-1 1.1-1.7 2.6-1.7 4.3 0 6.2 3.8 7.6 7.3 8-.5.4-.9 1.1-1 2.2-.9.4-3.3 1.1-4.7-1.3 0 0-.9-1.5-2.5-1.7 0 0-1.6 0-.1 1 0 0 1.1.5 1.8 2.4 0 0 .9 3.1 5.4 2.2v2.7c0 .4-.3.9-1.1.8-.2-.1-.4-.2-.7-.2C11.7 37.6 7 31.4 7 24c0-9.4 7.6-17 17-17s17 7.6 17 17c0 7.1-4.3 13.1-10.5 15.7z\"/></svg>",
    "github": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M24 2a22 22 0 0 0-7 42.88c1.1.2 1.5-.48 1.5-1.06v-3.74c-6.12 1.33-7.41-2.95-7.41-2.95a5.83 5.83 0 0 0-2.44-3.22c-2-1.37.15-1.34.15-1.34a4.62 4.62 0 0 1 3.37 2.27c2 3.36 5.15 2.39 6.4 1.83A4.7 4.7 0 0 1 20 33.72c-4.89-.56-10-2.44-10-10.87a8.5 8.5 0 0 1 2.26-5.9 7.91 7.91 0 0 1 .22-5.82s1.85-.59 6 2.26a20.85 20.85 0 0 1 11 0c4.2-2.85 6-2.26 6-2.26a7.9 7.9 0 0 1 .22 5.82 8.49 8.49 0 0 1 2.3 5.9c0 8.45-5.14 10.31-10 10.86a5.25 5.25 0 0 1 1.49 4.07v6c0 .69.4 1.27 1.51 1.06A22 22 0 0 0 24 2z\" fill-rule=\"evenodd\"/></svg>",
    "help-circle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><g data-name=\"Layer 2\"><path fill=\"none\" d=\"M0 0h48v48H0z\" data-name=\"invisible box\"/><g data-name=\"icons Q2\"><path d=\"M24 2a22 22 0 1 0 22 22A21.9 21.9 0 0 0 24 2zm0 40a18 18 0 1 1 18-18 18.1 18.1 0 0 1-18 18z\"/><path d=\"M24 38h-.4l-.4-.2h-.3l-.3-.3-.3-.3c0-.1-.1-.2-.2-.3s0-.3-.1-.4v-.8c.1-.1.1-.2.1-.4s.2-.2.2-.3l.3-.3a1.9 1.9 0 0 1 1.8-.6h.4l.3.2.3.3.3.3c0 .1.1.2.1.3s.1.3.2.4v.8c-.1.1-.1.2-.2.4s-.1.2-.1.3l-.3.3-.3.3h-.3l-.4.2zM24.4 30h-.8a2 2 0 0 1-1.1-2.6 7.3 7.3 0 0 1 3.6-3.9 4.9 4.9 0 0 0-1.1-9.4 5.3 5.3 0 0 0-4.2 1 5.3 5.3 0 0 0-1.8 3.8 2 2 0 0 1-4 0 8.8 8.8 0 0 1 3.3-6.8 8.8 8.8 0 0 1 7.5-1.9 8.9 8.9 0 0 1 2 16.8 3.7 3.7 0 0 0-1.6 1.7 1.9 1.9 0 0 1-1.8 1.3z\"/></g></g></svg>",
    "more-circle": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M24 2a22 22 0 1 0 22 22A22 22 0 0 0 24 2zm0 40a18 18 0 1 1 18-18 18 18 0 0 1-18 18z\"/><circle cx=\"13.82\" cy=\"24\" r=\"3.82\"/><circle cx=\"24\" cy=\"24\" r=\"3.82\"/><circle cx=\"34.18\" cy=\"24\" r=\"3.82\"/></svg>",
    "profile-outline": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path class=\"st0\" d=\"M24 34c4.3.1 8.5 1.2 12.3 3.2-6.9 6.4-17.6 6.4-24.5 0 3.7-2 7.9-3.1 12.2-3.2m0-32C11.8 2 2 11.8 2 24s9.8 22 22 22 22-9.8 22-22S36.2 2 24 2zM9.1 34.1c-5.6-8.2-3.4-19.4 4.8-25s19.4-3.4 25 4.8C43 20 43 28 38.9 34.1v.1-.1c-4.5-2.6-9.7-4-14.9-4.1-5.2.1-10.4 1.5-14.9 4.1z\"/><path class=\"st0\" d=\"M24 14c2.2 0 4 1.8 4 4s-1.8 4-4 4-4-1.8-4-4 1.8-4 4-4m0-4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8z\"/></svg>",
    "search": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><g data-name=\"Layer 2\"><path fill=\"none\" d=\"M0 0h48v48H0z\" data-name=\"invisible box\"/><path d=\"M30.9 28.1a14.8 14.8 0 0 0 3-10.9A15.2 15.2 0 0 0 20.1 4a15 15 0 0 0-3 29.9 15.3 15.3 0 0 0 11-2.9l12.5 12.4a1.9 1.9 0 0 0 2.8 0 1.9 1.9 0 0 0 0-2.8zm-10.1 1.8A11 11 0 0 1 8.2 17.1a10.8 10.8 0 0 1 8.9-8.9 10.9 10.9 0 0 1 12.7 12.7 11.1 11.1 0 0 1-9 9z\" data-name=\"icons Q2\"/></g></svg>",
    "slack": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M20.471 22.346l5.339-1.789 1.728 5.159-5.339 1.788z\"/><path d=\"M20.471 22.346l5.339-1.789 1.728 5.159-5.339 1.788z\"/><path d=\"M42.32 18.5C38.2 4.75 32.25 1.55 18.5 5.68S1.55 15.75 5.68 29.5 15.75 46.45 29.5 42.32 46.45 32.25 42.32 18.5zm-6.94 8.92l-2.59.86.9 2.69a2.08 2.08 0 0 1-1.31 2.62 1.79 1.79 0 0 1-.7.1 2.13 2.13 0 0 1-1.92-1.41l-.9-2.69-5.34 1.79.9 2.69a2.08 2.08 0 0 1-1.31 2.62 1.79 1.79 0 0 1-.7.1 2.13 2.13 0 0 1-1.92-1.41l-.9-2.69-2.59.87a1.79 1.79 0 0 1-.7.1 2.13 2.13 0 0 1-1.92-1.41 2.08 2.08 0 0 1 1.31-2.62l2.59-.86-1.73-5.15-2.55.86a1.79 1.79 0 0 1-.7.1 2.13 2.13 0 0 1-1.92-1.41 2.08 2.08 0 0 1 1.31-2.62l2.59-.86-.94-2.69a2.07 2.07 0 0 1 3.93-1.31l.9 2.69 5.34-1.79-.9-2.69a2.07 2.07 0 0 1 3.93-1.31l.9 2.69 2.56-.87a2.07 2.07 0 1 1 1.31 3.93l-2.59.86 1.73 5.15 2.59-.86a2.07 2.07 0 0 1 1.31 3.93z\"/></svg>",
    "tumblr": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><path d=\"M35.71 41.53C34.35 43 31.22 44 28.41 44h-.31c-9.44 0-11.49-6.94-11.49-11V21.76H12.9a.78.78 0 0 1-.78-.78v-5.31a1.32 1.32 0 0 1 .88-1.25c4.84-1.71 6.36-5.93 6.59-9.15.06-.85.51-1.27 1.25-1.27h5.54a.78.78 0 0 1 .78.78v9h6.49a.78.78 0 0 1 .78.78v6.39a.78.78 0 0 1-.78.78h-6.52v10.4c0 2.61 1.72 3.33 2.79 3.33a7.82 7.82 0 0 0 2.53-.54 1.68 1.68 0 0 1 1-.18.82.82 0 0 1 .57.62l1.72 5c.14.42.26.86-.03 1.17z\"/></svg>",
    "write": "<svg id=\"Layer_1\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\"><style>.st0{fill-rule:evenodd;clip-rule:evenodd}</style><path class=\"st0\" d=\"M45.4 17.3c.9-.9.6-2 0-2.6L33.3 2.5c-.7-.7-1.9-.7-2.6 0l-6.6 6.6 14.7 14.7 6.6-6.5zM44.1 42.2H20.5L36 26.6 21.4 11.9 2.8 30.5c-.4.3-.8 1.3-.8 1.8v11.8c0 1 .8 1.9 1.8 1.9H44c1.1 0 1.9-.9 1.9-1.9.1-1.1-.8-1.9-1.8-1.9z\"/></svg>"
  };
  _exports.default = _default;
});
;define("screwdriver-ui/sync/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    /**
     * Calls the sync api service to sync data
     * @method syncRequests
     * @param   {Number}  pipelineId
     * @param   {String}  syncPath   The path for the data to sync, e.g. webhooks, pullrequests
     * @return  {Promise}            Resolve nothing if success otherwise reject with error message
     */
    syncRequests(pipelineId, syncPath = '') {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE) + "/pipelines/".concat(pipelineId, "/sync/").concat(syncPath);
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url,
          type: 'POST',
          headers: {
            Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
          }
        }).done(() => resolve()).fail(jqXHR => reject(JSON.parse(jqXHR.responseText).message));
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/template/service", ["exports", "jquery", "screwdriver-ui/config/environment", "screwdriver-ui/utils/template"], function (_exports, _jquery, _environment, _template) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    templatesFormatter
  } = _template.default;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    getOneTemplate(name) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/templates/").concat(encodeURIComponent(name));
      return this.fetchData(url).then(templatesFormatter);
    },

    getTemplateTags(namespace, name) {
      const fullName = "".concat(namespace, "/").concat(name);
      const url = // eslint-disable-next-line max-len
      "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/templates/").concat(encodeURIComponent(fullName), "/tags");
      return this.fetchData(url);
    },

    getAllTemplates(namespace) {
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/templates");
      let params = {
        compact: true,
        sortBy: 'createTime',
        sort: 'descending'
      };

      if (namespace) {
        params.namespace = namespace;
      }

      return this.fetchData(url, params).then(templatesFormatter).then(templates => {
        // Reduce versions down to one entry
        // FIXME: This should be done in API
        const result = [];
        const names = {};
        templates.forEach(t => {
          if (!names[t.fullName]) {
            names[t.fullName] = 1;
            result.push(t);
          }
        });
        return result;
      });
    },

    fetchData(url, params = {}) {
      const ajaxConfig = {
        method: 'GET',
        url,
        data: params,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        // Call the token api to get the session info
        _jquery.default.ajax(ajaxConfig).done(templates => resolve(templates)).fail(response => reject(response));
      });
    },

    deleteTemplates(name) {
      // eslint-disable-next-line max-len
      const url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/templates/").concat(encodeURIComponent(name));
      const ajaxConfig = {
        method: 'DELETE',
        url,
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        headers: {
          Authorization: "Bearer ".concat(Ember.get(this, 'session.data.authenticated.token'))
        }
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        // Call the token api to get the session info
        _jquery.default.ajax(ajaxConfig).done(content => resolve(content)).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON && typeof response.responseJSON === 'object') {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          if (response.status === 401) {
            message = 'You do not have the permissions to remove this template.';
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/components/ember-popper-targeting-parent", ["exports", "ember-popper/templates/components/ember-popper-targeting-parent"], function (_exports, _emberPopperTargetingParent) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberPopperTargetingParent.default;
    }
  });
});
;define("screwdriver-ui/templates/components/ember-popper", ["exports", "ember-popper/templates/components/ember-popper"], function (_exports, _emberPopper) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _emberPopper.default;
    }
  });
});
;define("screwdriver-ui/templates/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    template: Ember.inject.service(),
    routeParams: Ember.computed('model', {
      get() {
        let route = this.model;
        let params = Object.assign({}, route.paramsFor('templates.namespace'), route.paramsFor('templates.detail'));
        return params;
      }

    }),
    crumbs: Ember.computed('routeParams', {
      get() {
        let breadcrumbs = [];
        let params = this.routeParams; // add name and namespace together to get full name, compare fullname  to params.name
        // if equal, use name

        if (params.namespace || params.detail) {
          breadcrumbs.push({
            name: 'Templates',
            params: ['templates']
          });
        }

        if (params.namespace) {
          breadcrumbs.push({
            name: params.namespace,
            params: ['templates.namespace', params.namespace]
          });
        }

        if (params.name) {
          breadcrumbs.push({
            name: params.name,
            params: ['templates.detail', params.namespace, params.name]
          });
        }

        return breadcrumbs;
      }

    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/detail/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const {
    alias
  } = Ember.computed;

  var _default = Ember.Controller.extend({
    selectedVersion: null,
    errorMessage: '',
    template: Ember.inject.service(),
    templates: alias('model'),

    reset() {
      this.set('errorMessage', '');
    },

    latest: Ember.computed('templates.[]', {
      get() {
        return this.templates[0];
      }

    }),
    versionTemplate: Ember.computed('selectedVersion', 'templates.[]', {
      get() {
        const version = this.selectedVersion || this.get('latest.version');
        return this.templates.findBy('version', version);
      }

    }),
    // Set selected version to null whenever the list of templates changes
    // eslint-disable-next-line ember/no-observers
    modelObserver: Ember.observer('templates.[]', function modelObserver() {
      this.set('selectedVersion', null);
    }),
    actions: {
      changeVersion(version) {
        this.set('selectedVersion', version);
      },

      removeTemplate(name) {
        return this.template.deleteTemplates(name).then(() => this.transitionToRoute('templates'), err => this.set('errorMessage', err));
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/detail/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    template: Ember.inject.service(),

    model(params) {
      return Ember.RSVP.all([this.template.getOneTemplate("".concat(params.namespace, "/").concat(params.name)), this.template.getTemplateTags(params.namespace, params.name)]).then(arr => {
        let [verPayload, tagPayload] = arr;
        verPayload = verPayload.filter(t => t.namespace === params.namespace);
        tagPayload.forEach(tagObj => {
          const taggedVerObj = verPayload.find(verObj => verObj.version === tagObj.version);

          if (taggedVerObj) {
            taggedVerObj.tag = taggedVerObj.tag ? "".concat(taggedVerObj.tag, " ").concat(tagObj.tag) : tagObj.tag;
          }
        });
        return verPayload;
      });
    },

    setupController(controller, model) {
      this._super(controller, model);

      controller.reset();
    },

    actions: {
      error(error) {
        if (error.status === 404) {
          this.transitionTo('/404');
        }

        return true;
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/detail/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "T29kKoJB",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"info-message\",null,[[\"message\",\"type\",\"icon\"],[[25,[\"errorMessage\"]],\"warning\",\"exclamation-triangle\"]]],false],[0,\"\\n\\n\"],[1,[29,\"template-header\",null,[[\"template\",\"onRemoveTemplate\"],[[25,[\"versionTemplate\"]],[29,\"action\",[[24,0,[]],\"removeTemplate\"],null]]]],false],[0,\"\\n\\n\"],[7,\"h4\"],[9],[0,\"Contents:\"],[10],[0,\"\\n\"],[1,[29,\"validator-job\",null,[[\"name\",\"job\",\"template\",\"collapsible\"],[[25,[\"versionTemplate\",\"fullName\"]],[25,[\"versionTemplate\",\"config\"]],[25,[\"versionTemplate\"]],false]]],false],[0,\"\\n\\n\"],[1,[29,\"template-versions\",null,[[\"templates\",\"changeVersion\"],[[25,[\"templates\"]],[29,\"action\",[[24,0,[]],\"changeVersion\"],null]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/templates/detail/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/error", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "YKKoRoV2",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"error-view\",null,[[\"statusCode\",\"statusMessage\",\"errorMessage\"],[[25,[\"model\",\"reason\",\"errors\",\"statusCode\"]],[25,[\"model\",\"reason\",\"errors\",\"error\"]],[25,[\"model\",\"reason\",\"errors\",\"message\"]]]]],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/templates/error.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/index/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    templates: Ember.computed.reads('model')
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/index/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    template: Ember.inject.service(),

    model() {
      return this.template.getAllTemplates();
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/index/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "4yxuyhCZ",
    "block": "{\"symbols\":[],\"statements\":[[4,\"tc-collection-list\",null,[[\"model\",\"filteringNamespace\",\"collectionType\"],[[25,[\"model\"]],[25,[\"targetNamespace\"]],\"Templates\"]],{\"statements\":[[0,\"  Templates are snippets of predefined code that people can use to replace a job definition in a screwdriver.yaml.\"],[7,\"br\"],[9],[10],[0,\"A template contains a series of predefined steps along with a selected Docker image.\\n\"]],\"parameters\":[]},null],[0,\"\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/templates/index/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/loading", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "5VujRhL/",
    "block": "{\"symbols\":[],\"statements\":[[1,[23,\"loading-view\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/templates/loading.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/namespace/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({
    template: Ember.inject.service(),
    templateName: 'templates/index',

    setupController(controller, model) {
      this._super(controller, model);

      controller.set('targetNamespace', this.paramsFor('templates.namespace').namespace);
    },

    model(params) {
      return this.template.getAllTemplates(params.namespace);
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    routeAfterAuthentication: 'templates',

    model() {
      return this;
    },

    actions: {
      willTransition(transition) {
        let newParams = transition.params[transition.targetName];
        this.controller.set('routeParams', newParams);
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/templates/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "U0mMpMBX",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"bread-crumbs\",null,[[\"crumbs\"],[[25,[\"crumbs\"]]]]],false],[0,\"\\n\\n\"],[1,[23,\"outlet\"],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/templates/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/token/model", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.Model.extend({
    pipelineId: _emberData.default.attr('number'),
    userId: _emberData.default.attr('number'),
    name: _emberData.default.attr('string'),
    description: _emberData.default.attr('string', {
      defaultValue: ''
    }),
    lastUsed: _emberData.default.attr('string'),
    value: _emberData.default.attr('string'),
    action: _emberData.default.attr('string')
  });

  _exports.default = _default;
});
;define("screwdriver-ui/token/serializer", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = _emberData.default.RESTSerializer.extend({
    /**
     * Override the serializeIntoHash method
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
    serializeIntoHash(hash, typeClass, snapshot) {
      const dirty = snapshot.changedAttributes();
      Object.keys(dirty).forEach(key => {
        dirty[key] = dirty[key][1];
      });
      const h = Ember.assign(hash, dirty);
      delete h.lastUsed;
      delete h.userId;
      delete h.action;
      delete h.pipelineId;
      return h;
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/user-settings/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Controller.extend({
    refreshService: Ember.inject.service('user-settings'),
    newToken: null,
    tokens: Ember.computed.alias('model'),
    actions: {
      createToken(name, description) {
        const newToken = this.store.createRecord('token', {
          name,
          description: description || '',
          action: 'created'
        });
        return newToken.save().then(token => {
          this.set('newToken', token);
        }).catch(error => {
          newToken.destroyRecord();
          throw error;
        });
      },

      refreshToken(id) {
        return this.refreshService.refreshToken(id).then(token => {
          this.set('newToken', token);
        });
      }

    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/user-settings/route", ["exports", "ember-simple-auth/mixins/authenticated-route-mixin"], function (_exports, _authenticatedRouteMixin) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend(_authenticatedRouteMixin.default, {
    session: Ember.inject.service(),
    titleToken: 'User Settings',
    routeAfterAuthentication: 'user-settings',

    model() {
      // Guests should not access this page
      if (Ember.get(this, 'session.data.authenticated.isGuest')) {
        this.transitionTo('home');
      }

      this.store.unloadAll('token');
      return this.store.findAll('token');
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/user-settings/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service('session'),

    refreshToken(id) {
      const token = Ember.get(this, 'session.data.authenticated.token');
      return new Ember.RSVP.Promise((resolve, reject) => {
        _jquery.default.ajax({
          url: "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/").concat(_environment.default.APP.SDAPI_NAMESPACE, "/tokens/").concat(id, "/refresh"),
          method: 'PUT',
          headers: {
            Authorization: "Bearer ".concat(token)
          },
          crossDomain: true,
          xhrFields: {
            withCredentials: true
          }
        }).done(content => resolve(Object.assign(content, {
          action: 'refreshed'
        }))).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON) {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/user-settings/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "pU37Z8pr",
    "block": "{\"symbols\":[],\"statements\":[[1,[29,\"token-list\",null,[[\"tokens\",\"newToken\",\"onCreateToken\",\"onRefreshToken\",\"tokenName\",\"tokenScope\"],[[25,[\"tokens\"]],[25,[\"newToken\"]],[29,\"action\",[[24,0,[]],\"createToken\"],null],[29,\"action\",[[24,0,[]],\"refreshToken\"],null],\"User access\",\"your account\"]]],false],[0,\"\\n\"]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/user-settings/template.hbs"
    }
  });

  _exports.default = _default;
});
;define("screwdriver-ui/utils/build", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.getActiveStep = _exports.statusIcon = _exports.isPRJob = _exports.isActiveBuild = void 0;

  /**
   * Check if the current build is active based on build status
   * @param  {String}  status  Build status
   * @param  {String}  endTime Build end time
   * @return {Boolean} true if build is active.
   */
  const isActiveBuild = (status, endTime) => status === 'QUEUED' || status === 'RUNNING' || status === 'BLOCKED' || status === 'UNSTABLE' && !endTime;
  /**
   * Check if the current job is a PR job
   * @param  {String}  job name
   * @return {Boolean} true if PR job
   */


  _exports.isActiveBuild = isActiveBuild;

  const isPRJob = jobName => /^PR-/.test(jobName);

  _exports.isPRJob = isPRJob;

  const statusIcon = (status, isLight) => {
    let icon;

    switch (status) {
      case 'QUEUED':
      case 'RUNNING':
        icon = 'spinner fa-spin';
        break;

      case 'CREATED':
      case 'SUCCESS':
        icon = "check-circle".concat(isLight ? '-o' : '');
        break;

      case 'UNSTABLE':
        icon = 'exclamation-circle';
        break;

      case 'FROZEN':
        icon = 'fa-snowflake-o';
        break;

      case 'BLOCKED':
      case 'COLLAPSED':
        icon = 'fa-ban fa-flip-horizontal';
        break;

      case 'FAILURE':
      case 'ABORTED':
        icon = "times-circle".concat(isLight ? '-o' : '');
        break;

      default:
        icon = 'circle-o';
        break;
    }

    return icon;
  };
  /**
   * Return active step name
   * @param  {Array}  build steps
   * @return {String} active step name
   */


  _exports.statusIcon = statusIcon;

  const getActiveStep = (steps = []) => {
    const runningStep = steps.find(s => s.startTime && !s.endTime);
    let name;

    if (runningStep && runningStep.name) {
      name = runningStep.name;
    } else {
      const failedStep = steps.find(s => s.code);

      if (failedStep && failedStep.name) {
        name = failedStep.name;
      }
    }

    return name;
  };

  _exports.getActiveStep = getActiveStep;
});
;define("screwdriver-ui/utils/git", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.parse = parse;
  _exports.getCheckoutUrl = getCheckoutUrl;

  /**
   * Parse a git or https checkout url and get info about the repo
   * @method git
   * @param  {String}  scmUrl Url to parse
   * @return {Object}         Data about the url
   */
  function parse(scmUrl) {
    // eslint-disable-next-line max-len
    const match = scmUrl.match(/^(?:(?:https:\/\/(?:[^@/:\s]+@)?)|git@)+([^/:\s]+)(?:\/|:)([^/:\s]+)\/([^\s]+?)(?:\.git)?(#[^\s]+)?$/);

    if (!match) {
      return {
        valid: false
      };
    }

    const result = {
      server: match[1],
      owner: match[2],
      repo: match[3],
      branch: match[4] ? match[4].slice(1) : 'master',
      valid: true
    };
    return result;
  }
  /**
   * Generate the checkout URL based on pipeline values
   * @method getCheckoutUrl
   * @param  {Object}       config
   * @param  {String}       config.appId    App ID in the form of <organization>/<repo>
   * @param  {String}       config.scmUri   Scm URI with <server>:<URI>:<branch>
   * @return {String}                       Returns the checkout URL
   */


  function getCheckoutUrl(config) {
    const scmUri = config.scmUri.split(':');
    const checkoutUrl = "git@".concat(scmUri[0], ":").concat(config.appId, ".git#").concat(scmUri[2]);
    return checkoutUrl;
  }
});
;define("screwdriver-ui/utils/graph-tools", ["exports", "ember-data"], function (_exports, _emberData) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.subgraphFilter = _exports.isTrigger = _exports.isRoot = _exports.graphDepth = _exports.decorateGraph = _exports.icon = _exports.node = void 0;
  const STATUS_MAP = {
    SUCCESS: {
      icon: '\ue903'
    },
    STARTED_FROM: {
      icon: '\ue907'
    },
    DOWNSTREAM_TRIGGER: {
      icon: '\ue907'
    },
    RUNNING: {
      icon: '\ue905'
    },
    QUEUED: {
      icon: '\ue904'
    },
    ABORTED: {
      icon: '\ue900'
    },
    FAILURE: {
      icon: '\ue906'
    },
    DISABLED: {
      icon: '\ue902'
    },
    UNKNOWN: {
      icon: '\ue901'
    },
    UNSTABLE: {
      icon: '\ue909'
    },
    BLOCKED: {
      icon: '\ue908'
    },
    COLLAPSED: {
      icon: '\ue908'
    },
    FROZEN: {
      icon: '\ue910'
    }
  };
  const edgeSrcBranchRegExp = new RegExp('^~(pr|commit):/(.+)/$');
  const triggerBranchRegExp = new RegExp('^~(pr|commit):(.+)$');
  /**
   * Find a node from the list of nodes
   * @method node
   * @param  {Array} nodes  List of graph node objects
   * @param  {String} name  Name of the node to find
   * @return {Object}       Reference to the node in the list
   */

  const node = (nodes, name) => nodes.find(o => o.name === name);
  /**
   * Find a build for the given job id
   * @method build
   * @param  {Array} builds   List of build objects
   * @param  {String} jobId   The job id of the build
   * @return {Object}         Reference to the build object from the list if found
   */


  _exports.node = node;

  const build = (builds, jobId) => builds.find(b => b && "".concat(Ember.get(b, 'jobId')) === "".concat(jobId));
  /**
   * Find a job for the given job id
   * @method job
   * @param  {Array}  jobs    List of job objects
   * @param  {String} jobId   The job id of the build
   * @return {Object}         Reference to the job object from the list if found
   */


  const job = (jobs, jobId) => jobs.find(j => j && "".concat(Ember.get(j, 'id')) === "".concat(jobId));
  /**
   * Find the icon to set as the text for a node
   * @method icon
   * @param  {String} status Text that denotes a build status
   * @return {String}        Unicode character that maps to an icon in screwdriver icon font
   */


  const icon = status => STATUS_MAP[status] ? STATUS_MAP[status].icon : STATUS_MAP.UNKNOWN.icon;
  /**
   * Calculate how many nodes are visited in the graph from the given starting point
   * @method graphDepth
   * @param  {Array}   edges    List of graph edges
   * @param  {String}  start    Node name for starting point
   * @param  {Set}     visited  List of visited nodes
   * @return {Number}           Number of visited nodes
   */


  _exports.icon = icon;

  const graphDepth = (edges, start, visited = new Set()) => {
    if (!Array.isArray(edges)) {
      return Number.MAX_VALUE;
    }

    const dests = edges.filter(e => e.src === start); // For partials/detached jobs

    if (!start.startsWith('~')) {
      visited.add(start);
    } // walk the graph


    if (dests.length) {
      dests.forEach(e => {
        visited.add(e.dest);
        graphDepth(edges, e.dest, visited);
      });
    }

    return visited.size;
  };
  /**
   * Walks the graph to find siblings and set their positions
   * @method walkGraph
   * @param  {Object}  graph Raw graph definition
   * @param  {String}  start The job name to start from for this iteration
   * @param  {Number}  x     The column for this iteration
   * @param  {Array}   y     Accumulator of column depth
   */


  _exports.graphDepth = graphDepth;

  const walkGraph = (graph, start, x, y) => {
    if (!y[x]) {
      y[x] = y[0] - 1;
    }

    const nodeNames = graph.edges.filter(e => e.src === start).map(e => e.dest);
    nodeNames.forEach(name => {
      const obj = node(graph.nodes, name);

      if (!obj.pos) {
        obj.pos = {
          x,
          y: y[x]
        };
        y[x] += 1;
      }

      walkGraph(graph, name, x + 1, y);
    });
  };
  /**
   * Determine if a node is a root node by seeing if it is listed as a destination
   * @method isRoot
   * @param  {Array}  edges List of graph edges
   * @param  {String}  name The job name to check
   * @return {Boolean}      True if the node is not a dest in edges
   */


  const isRoot = (edges, name) => !edges.find(e => e.dest === name);
  /**
   * Determine if a node is a trigger by seeing if it matches the startFrom
   * @param  {String}  name  The node name to check
   * @param  {String}  start The start from
   * @return {Boolean}       True if the node matches the startFrom
   */


  _exports.isRoot = isRoot;

  const isTrigger = (name, start) => {
    // Set a status on the trigger node (if it starts with ~)
    if (name === start && /^~/.test(name)) {
      return true;
    } // Set status on trigger node if is branch specific trigger
    // Check if node name has regex


    const edgeSrcBranch = name.match(edgeSrcBranchRegExp);

    if (edgeSrcBranch) {
      // Check if trigger is specific branch commit or pr
      const triggerBranch = start.match(triggerBranchRegExp); // Check whether job types of trigger and node name match

      if (triggerBranch && triggerBranch[1] === edgeSrcBranch[1]) {
        // Check if trigger branch and node branch regex match
        if (triggerBranch[2].match(edgeSrcBranch[2])) {
          return true;
        }
      }
    }

    return false;
  };
  /**
   * Determine if an node has destinations that have already been processed.
   * This allows a graph's common root nodes to collapse instead of taking up multiple lines.
   * @method hasProcessedDest
   * @param  {Object}         graph The processed graph
   * @param  {String}         name  node name
   * @return {Boolean}              True if a destination of the node has already been processed
   */


  _exports.isTrigger = isTrigger;

  const hasProcessedDest = (graph, name) => {
    const nodes = graph.edges.filter(edge => edge.src === name).map(edge => edge.dest);
    return nodes.some(n => {
      const found = node(graph.nodes, n);
      return found && typeof found.pos === 'object';
    });
  };
  /**
   * Clones and decorates an input graph datastructure into something that can be used to display
   * a custom directed graph
   * @method decorateGraph
   * @param  {Object}      inputGraph A directed graph representation { nodes: [], edges: [] }
   * @param  {Array|DS.PromiseArray}  [builds]     A list of build metadata
   * @param  {Array|DS.PromiseArray}  [jobs]       A list of job metadata
   * @param  {String}      [start]    Node name that indicates what started the graph
   * @return {Object}                 A graph representation with row/column coordinates for drawing, and meta information for scaling
   */


  const decorateGraph = ({
    inputGraph,
    builds,
    jobs,
    start
  }) => {
    // deep clone
    const graph = JSON.parse(JSON.stringify(inputGraph));
    const {
      nodes
    } = graph;
    const buildsAvailable = (Array.isArray(builds) || builds instanceof _emberData.default.PromiseArray) && Ember.get(builds, 'length');
    const jobsAvailable = (Array.isArray(jobs) || jobs instanceof _emberData.default.PromiseArray) && Ember.get(jobs, 'length');
    const {
      edges
    } = graph;
    let y = [0]; // accumulator for column heights

    nodes.forEach(n => {
      // Set root nodes on left
      if (isRoot(edges, n.name)) {
        if (!hasProcessedDest(graph, n.name)) {
          // find the next unused row
          let tmp = Math.max(...y); // Set all the starting pos for columns to that row

          y = y.map(() => tmp);
        } // Set the node position


        n.pos = {
          x: 0,
          y: y[0]
        }; // increment by one for next root node

        y[0] += 1; // recursively walk the graph from root/ detached node

        walkGraph(graph, n.name, 1, y);
      } // Get job information


      const jobId = Ember.get(n, 'id');

      if (jobsAvailable) {
        const j = job(jobs, jobId);
        const jobIsDisabled = j ? Ember.get(j, 'isDisabled') : null; // Set build status to disabled if job is disabled

        if (jobIsDisabled) {
          const state = Ember.get(j, 'state');
          const stateWithCapitalization = state[0].toUpperCase() + state.substring(1).toLowerCase();
          const stateChanger = Ember.get(j, 'stateChanger');
          n.status = state;
          n.stateChangeMessage = stateChanger ? "".concat(stateWithCapitalization, " by ").concat(stateChanger) : stateWithCapitalization;
        }
      } // Get build information


      if (buildsAvailable && jobId) {
        const b = build(builds, jobId); // Add build information to node

        if (b) {
          n.status = Ember.get(b, 'status');
          n.buildId = Ember.get(b, 'id');
        }
      } // Set a STARTED_FROM status on the trigger node


      if (start && isTrigger(n.name, start)) {
        n.status = 'STARTED_FROM';
      }
    }); // Decorate edges with positions and status

    edges.forEach(e => {
      const srcNode = node(nodes, e.src);
      const destNode = node(nodes, e.dest);

      if (!srcNode || !destNode) {
        return;
      }

      e.from = srcNode.pos;
      e.to = destNode.pos;

      if (srcNode.status && srcNode.status !== 'RUNNING') {
        e.status = srcNode.status;
      }
    }); // For auto-scaling canvas size

    graph.meta = {
      // Validator starts with a graph with no nodes or edges. Should have a size of at least 1
      height: Math.max(1, ...y),
      width: Math.max(1, y.length - 1)
    };
    return graph;
  };
  /**
   * Filter to the subgraph in which the root is the start from node
   * @param   {Array}   [{nodes}]   Array of graph vertices
   * @param   {Array}   [{edges}]   Array of graph edges
   * @param   {String}  [startNode] Starting/trigger node
   * @returns {Object}              Nodes and edges for the filtered subgraph
   */


  _exports.decorateGraph = decorateGraph;

  const subgraphFilter = ({
    nodes,
    edges
  }, startNode) => {
    if (!startNode || !nodes.length) {
      return {
        nodes,
        edges
      };
    }

    let start = startNode; // startNode can be a PR job in PR events, so trim PR prefix from node name

    if (startNode.match(/^PR-[0-9]+:/)) {
      start = startNode.split(':')[1];
    }

    let visiting = [start];
    let visited = new Set(visiting);

    if (edges.length) {
      while (visiting.length) {
        let cur = visiting.shift();
        edges.forEach(e => {
          if (e.src === cur) {
            visiting.push(e.dest);
            visited.add(e.dest);
          }
        });
      }
    }

    return {
      nodes: nodes.filter(n => visited.has(n.name)),
      edges: edges.filter(e => visited.has(e.src) && visited.has(e.dest))
    };
  };

  _exports.subgraphFilter = subgraphFilter;
});
;define("screwdriver-ui/utils/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /**
   * Construct the template's full name (e.g.: namespace/myTemplate)
   * @method getFullName
   * @param  {Object}       config
   * @param  {String}       config.name       Template name
   * @param  {String}       config.namespace  Template namespace
   * @return {String}                         Returns the template full name
   */
  const getFullName = config => {
    let {
      name,
      namespace
    } = config;
    let fullName = name;

    if (namespace && namespace !== 'default') {
      fullName = "".concat(namespace, "/").concat(name);
    }

    return fullName;
  };
  /**
   * Get the humanized last update time
   * @param  {Object} config
   * @param  {String} config.createTime   Template create time
   * @return {String}                     Returns humanized last update time
   */


  const getLastUpdatedTime = ({
    createTime
  }) => {
    if (!createTime) {
      return null;
    }

    let timeDiff = Date.now() - new Date(createTime).getTime();
    const lastUpdated = "".concat(humanizeDuration(timeDiff, {
      round: true,
      largest: 1
    }), " ago");
    return lastUpdated;
  };
  /**
   * Format templates to add fullName and humanized date
   * @param  {Array} Templates
   * @return {Array} Formatted templates
   */


  const templatesFormatter = templates => {
    templates.forEach(t => {
      // Add full template name
      t.fullName = getFullName({
        name: t.name,
        namespace: t.namespace
      });

      if (t.createTime) {
        // Add last updated time
        t.lastUpdated = getLastUpdatedTime({
          createTime: t.createTime
        });
      }
    });
    return templates;
  };

  var _default = {
    getFullName,
    getLastUpdatedTime,
    templatesFormatter
  };
  _exports.default = _default;
});
;define("screwdriver-ui/utils/time-range", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.iso8601UpToMinute = iso8601UpToMinute;
  _exports.toCustomLocaleString = toCustomLocaleString;
  _exports.default = timeRange;
  _exports.CONSTANT = void 0;

  /**
   *
   *
   * @export
   * @param {Date} date date object
   * @returns {String} ISO 8601 format up to the minute at most, total 16 characters
   */
  function iso8601UpToMinute(date) {
    const d = new Date(date).toISOString();
    return d.substring(0, d.lastIndexOf(':'));
  }
  /**
   * Return custom locale string for date
   *
   * @export
   * @param {Date} date input date
   * @param {String} [config.timeZone] targeted time zone, e.g. UTC, America/Los_Angeles
   * @param {Object} [config.options] other options for display format
   * @returns {String} custom locale string
   */


  function toCustomLocaleString(date, {
    timeZone,
    options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  } = {}) {
    const tz = timeZone && timeZone.trim();

    if (tz) {
      options.timeZone = tz;
    }

    return date.toLocaleString('en-US', options);
  }
  /**
   * Returns start and end dates given time range and end date
   *
   * @export
   * @param {Date} end end date
   * @param {String} range duration string, e.g. '1hr', '1wk', '1mo' for now
   * @returns {Object} start and end dates of specific time range in ISO format, or null if unrecognize
   */


  function timeRange(end, range) {
    const match = range.match(/(\d+)([^\d]+)/);

    if (!match) {
      return null;
    }

    let current = new Date(end);
    let startTime;
    let [, quantity, duration] = match;
    quantity = +quantity;
    const endTime = iso8601UpToMinute(current);

    switch (duration) {
      case 'hr':
        current.setUTCHours(current.getUTCHours() - quantity);
        break;

      case 'd':
        current.setUTCDate(current.getUTCDate() - quantity);
        break;

      case 'wk':
        current.setUTCDate(current.getUTCDate() - quantity * 7);
        break;

      case 'mo':
        current.setUTCMonth(current.getUTCMonth() - quantity);
        break;

      default:
        return null;
    }

    startTime = iso8601UpToMinute(current);
    return {
      startTime,
      endTime
    };
  }

  const CONSTANT = {
    WEEK: 60 * 60 * 24 * 7 * 1e3,
    MONTH: 60 * 60 * 24 * 30 * 1e3,
    SEMI_YEAR: 60 * 60 * 24 * 30 * 6 * 1e3,
    YEAR: 60 * 60 * 24 * 365 * 1e3
  };
  _exports.CONSTANT = CONSTANT;
});
;define("screwdriver-ui/utils/titleize", ["exports", "ember-cli-string-helpers/utils/titleize"], function (_exports, _titleize) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  Object.defineProperty(_exports, "default", {
    enumerable: true,
    get: function () {
      return _titleize.default;
    }
  });
});
;define("screwdriver-ui/validator/controller", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  /**
   * Fetches validator results in debounce
   * @method getResults
   * @private
   */
  function getResults() {
    this.validator.getValidationResults(this.yaml).then(results => this.set('results', results));
  }

  var _default = Ember.Controller.extend({
    validator: Ember.inject.service(),
    yaml: '',
    results: '',
    isTemplate: Ember.computed('yaml', {
      get() {
        return this.validator.isTemplate(this.yaml);
      }

    }),
    // eslint-disable-next-line ember/no-observers
    onYamlChange: Ember.observer('yaml', function onYamlChange() {
      const yaml = this.yaml.trim();

      if (!yaml) {
        this.set('results', '');
        return;
      }

      Ember.run.debounce(this, getResults, 250);
    })
  });

  _exports.default = _default;
});
;define("screwdriver-ui/validator/route", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Route.extend({});

  _exports.default = _default;
});
;define("screwdriver-ui/validator/service", ["exports", "jquery", "screwdriver-ui/config/environment"], function (_exports, _jquery, _environment) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.Service.extend({
    session: Ember.inject.service(),

    /**
     * Simple test to determine if yaml looks like a template file
     * @method isTemplate
     * @param  {String}   yaml Raw yaml text
     * @return {Boolean}
     */
    isTemplate(yaml) {
      return /^name/.test(yaml);
    },

    /**
     * Cross-domain communication to validation endpoints
     * @method getValidationResults
     * @param {String} yaml           yaml payload
     * @return {Promise}
     */
    getValidationResults(yaml) {
      let url = "".concat(_environment.default.APP.SDAPI_HOSTNAME, "/v4/validator");

      if (this.isTemplate(yaml)) {
        url += '/template';
      }

      const ajaxConfig = {
        method: 'post',
        url,
        headers: {
          Authorization: 'Bearer token1234'
        },
        contentType: 'application/json',
        crossDomain: true,
        xhrFields: {
          withCredentials: true
        },
        data: JSON.stringify({
          yaml
        })
      };
      return new Ember.RSVP.Promise((resolve, reject) => {
        // Call the token api to get the session info
        _jquery.default.ajax(ajaxConfig).done(content => resolve(content)).fail(response => {
          let message = "".concat(response.status, " Request Failed");

          if (response && response.responseJSON) {
            message = "".concat(response.status, " ").concat(response.responseJSON.error);
          }

          return reject(message);
        });
      });
    }

  });

  _exports.default = _default;
});
;define("screwdriver-ui/validator/template", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = Ember.HTMLBars.template({
    "id": "3OI9F97h",
    "block": "{\"symbols\":[],\"statements\":[[7,\"div\"],[11,\"class\",\"row\"],[9],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-6\"],[9],[0,\"\\n    \"],[1,[29,\"validator-input\",null,[[\"yaml\"],[[29,\"mut\",[[25,[\"yaml\"]]],null]]]],false],[0,\"\\n  \"],[10],[0,\"\\n  \"],[7,\"div\"],[11,\"class\",\"col-xs-12 col-md-6\"],[9],[0,\"\\n    \"],[1,[29,\"validator-results\",null,[[\"results\",\"isTemplate\"],[[25,[\"results\"]],[25,[\"isTemplate\"]]]]],false],[0,\"\\n  \"],[10],[0,\"\\n\"],[10],[0,\"\\n\"],[1,[23,\"outlet\"],false]],\"hasEval\":false}",
    "meta": {
      "moduleName": "screwdriver-ui/validator/template.hbs"
    }
  });

  _exports.default = _default;
});
;

;define('screwdriver-ui/config/environment', [], function() {
  var prefix = 'screwdriver-ui';
try {
  var metaName = prefix + '/config/environment';
  var rawConfig = document.querySelector('meta[name="' + metaName + '"]').getAttribute('content');
  var config = JSON.parse(decodeURIComponent(rawConfig));

  var exports = { 'default': config };

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

});

;
          if (!runningTests) {
            require("screwdriver-ui/app")["default"].create({"SDAPI_HOSTNAME":"http://localhost:9001","SDAPI_NAMESPACE":"v4","SDSTORE_HOSTNAME":"http://172.131.215.191:9002","SDSTORE_NAMESPACE":"v1","SDDOC_URL":"http://docs.screwdriver.cd","SLACK_URL":"http://slack.screwdriver.cd","BUILD_RELOAD_TIMER":5000,"EVENT_RELOAD_TIMER":5000,"LOG_RELOAD_TIMER":1000,"NUM_EVENTS_LISTED":5,"NUM_PIPELINES_LISTED":50,"MAX_LOG_LINES":1000,"DEFAULT_LOG_PAGE_SIZE":10,"FORCE_RELOAD_WAIT":100,"name":"screwdriver-ui","version":"2.0.0+cfcb4516"});
          }
        
//# sourceMappingURL=screwdriver-ui.map
