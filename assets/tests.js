'use strict';

define("screwdriver-ui/tests/acceptance/create-page-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | create', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('/create a pipeline: not logged in will redirect', async function (assert) {
      await (0, _testHelpers.visit)('/create');
      assert.equal((0, _testHelpers.currentURL)(), '/login');
    });
    (0, _qunit.test)('/create a pipeline: SUCCESS', async function (assert) {
      server.post('http://localhost:8080/v4/pipelines', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1'
      })]);
      server.get('http://localhost:8080/v4/pipelines/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1'
      })]);
      server.get('http://localhost:8080/v4/pipelines/1/events', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/builds', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/create');
      assert.equal((0, _testHelpers.currentURL)(), '/create');
      await (0, _testHelpers.fillIn)('.text-input', 'git@github.com:foo/bar.git');
      await (0, _testHelpers.triggerEvent)('.text-input', 'keyup');
      await (0, _testHelpers.click)('button.blue-button');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/1/events');
    });
    (0, _qunit.test)('/create a pipeline with rootDir: SUCCESS', async function (assert) {
      server.post('http://localhost:8080/v4/pipelines', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1'
      })]);
      server.get('http://localhost:8080/v4/pipelines/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1'
      })]);
      server.get('http://localhost:8080/v4/pipelines/1/events', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/builds', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/create');
      assert.equal((0, _testHelpers.currentURL)(), '/create');
      await (0, _testHelpers.fillIn)('.scm-url', 'git@github.com:foo/bar.git');
      await (0, _testHelpers.triggerEvent)('.scm-url', 'keyup');
      await (0, _testHelpers.click)('.checkbox-input');
      await (0, _testHelpers.fillIn)('.root-dir', 'lib');
      await (0, _testHelpers.click)('button.blue-button');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/1/events');
    });
    (0, _qunit.test)('/create a pipeline: FAILURE', async function (assert) {
      server.post('http://localhost:8080/v4/pipelines', () => [409, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        statusCode: 409,
        error: 'Conflict',
        message: 'something conflicting'
      })]);
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/create');
      assert.equal((0, _testHelpers.currentURL)(), '/create');
      await (0, _testHelpers.fillIn)('.text-input', 'git@github.com:foo/bar.git');
      await (0, _testHelpers.triggerEvent)('.text-input', 'keyup');
      await (0, _testHelpers.click)('button.blue-button');
      assert.equal((0, _testHelpers.currentURL)(), '/create');
      assert.dom('.alert > span').hasText('something conflicting');
    });
  });
});
define("screwdriver-ui/tests/acceptance/dashboards-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | dashboards', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/collections/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelines: [{
          id: 12742,
          scmUri: 'github.com:12345678:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/screwdriver',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          lastEventId: 12,
          lastBuilds: [{
            id: 123,
            status: 'SUCCESS'
          }, {
            id: 124,
            status: 'FAILURE'
          }]
        }, {
          id: 12743,
          scmUri: 'github.com:87654321:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/ui',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/ui/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          prs: {
            open: 2,
            failing: 1
          }
        }]
      }])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting / when not logged in', async function (assert) {
      await (0, _testHelpers.visit)('/');
      assert.equal((0, _testHelpers.currentURL)(), '/login');
    });
    (0, _qunit.test)('visiting / when logged in and no collections', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/');
      assert.equal((0, _testHelpers.currentURL)(), '/');
    });
    (0, _qunit.test)('visiting / when logged in and have collections', async function (assert) {
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }, {
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }])]);
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/');
      assert.equal((0, _testHelpers.currentURL)(), '/dashboards/1');
      assert.dom('.header__name').hasText('collection1');
      assert.dom('.header__description').hasText('description1');
      assert.dom('table').exists({
        count: 1
      });
      assert.dom('th.app-id').hasText('Name');
      assert.dom('th.branch').hasText('Branch');
      assert.dom('th.account').hasText('Account');
      assert.dom('tr').exists({
        count: 4
      });
      assert.dom('td').exists({
        count: 14
      });
    });
    (0, _qunit.test)('visiting /dashboards when not logged in', async function (assert) {
      await (0, _testHelpers.visit)('/dashboards');
      assert.equal((0, _testHelpers.currentURL)(), '/login');
    });
    (0, _qunit.test)('visiting /dashboards when logged in and no collections', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/dashboards');
      assert.equal((0, _testHelpers.currentURL)(), '/');
    });
    (0, _qunit.test)('visiting /dashboards/1', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/dashboards/1');
      assert.equal((0, _testHelpers.currentURL)(), '/dashboards/1');
      assert.dom('.header__name').hasText('collection1');
      assert.dom('.header__description').hasText('description1');
      assert.dom('table').exists({
        count: 1
      });
      assert.dom('th.app-id').hasText('Name');
      assert.dom('th.branch').hasText('Branch');
      assert.dom('th.account').hasText('Account');
      assert.dom('tr').exists({
        count: 4
      });
      assert.dom('td').exists({
        count: 14
      });
    });
    (0, _qunit.test)('creating a collection', async function (assert) {
      assert.expect(7);
      const expectedRequestBody = {
        name: 'collection3',
        description: 'description3'
      };
      server.post('http://localhost:8080/v4/collections', request => {
        assert.deepEqual(JSON.parse(request.requestBody), expectedRequestBody);
        return [201, {
          'Content-Type': 'application/json'
        }, JSON.stringify({
          id: 3,
          name: 'collection3',
          description: 'description3'
        })];
      }); // GET request made in the search route for pipelines

      server.get('http://localhost:8080/v4/pipelines', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 12742,
        scmUri: 'github.com:12345678:master',
        createTime: '2017-01-05T00:55:46.775Z',
        admins: {
          username: true
        },
        workflow: ['main', 'publish'],
        scmRepo: {
          name: 'screwdriver-cd/screwdriver',
          branch: 'master',
          url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
        },
        scmContext: 'github:github.com',
        annotations: {}
      }, {
        id: 12743,
        scmUri: 'github.com:87654321:master',
        createTime: '2017-01-05T00:55:46.775Z',
        admins: {
          username: true
        },
        workflow: ['main', 'publish'],
        scmRepo: {
          name: 'screwdriver-cd/ui',
          branch: 'master',
          url: 'https://github.com/screwdriver-cd/ui/tree/master'
        },
        scmContext: 'github:github.com',
        annotations: {}
      }])]);
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/'); // Logged in but no collections, url should be `/`

      assert.equal((0, _testHelpers.currentURL)(), '/');
      await (0, _testHelpers.visit)('/search');
      assert.dom('.flyout').exists({
        count: 1
      });
      assert.notOk((0, _testHelpers.findAll)('.modal').length);
      assert.notOk((0, _testHelpers.findAll)('.collection-wrapper row').length);
      await (0, _testHelpers.click)('.new');
      assert.dom('.modal').exists({
        count: 1
      });
      await (0, _testHelpers.fillIn)('.name input', 'collection3');
      await (0, _testHelpers.triggerEvent)('.name input', 'keyup');
      await (0, _testHelpers.fillIn)('.description textarea', 'description3');
      await (0, _testHelpers.triggerEvent)('.description textarea', 'keyup');
      await (0, _testHelpers.click)('.collection-form__create'); // The modal should disappear

      assert.notOk((0, _testHelpers.findAll)('.modal').length);
    });
  });
});
define("screwdriver-ui/tests/acceptance/metrics-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender", "screwdriver-ui/tests/mock/pipeline", "screwdriver-ui/tests/mock/metrics", "screwdriver-ui/tests/mock/jobs", "screwdriver-ui/tests/mock/workflow-graph"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender, _pipeline, _metrics, _jobs, _workflowGraph) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | metrics', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      const graph = (0, _workflowGraph.default)();
      const metrics = (0, _metrics.default)();
      const jobs = (0, _jobs.default)();
      const pipeline = (0, _pipeline.default)(graph);
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/4', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(pipeline)]);
      server.get('http://localhost:8080/v4/pipelines/4/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(jobs)]);
      server.get('http://localhost:8080/v4/pipelines/4/metrics', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(metrics)]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/4/metrics', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/pipelines/4/metrics');
      assert.dom('.chart-c3').exists({
        count: 2
      });
      assert.dom('.range-selection button').exists({
        count: 7
      });
      assert.dom('.custom-date-selection input').exists({
        count: 1
      });
      assert.dom('.filters-selection input').exists({
        count: 1
      });
      assert.dom('.chart-pipeline-info .measure').exists({
        count: 5
      });
      assert.dom('.chart-c3 svg').exists({
        count: 2
      });
      assert.dom('.chart-c3 .c3-event-rects').exists({
        count: 2
      });
      assert.dom('.chart-cta').exists({
        count: 1
      });
      assert.dom('.chart-cta select').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/acceptance/pipeline-builds-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender", "screwdriver-ui/tests/mock/pipeline", "screwdriver-ui/tests/mock/events", "screwdriver-ui/tests/mock/builds", "screwdriver-ui/tests/mock/workflow-graph", "screwdriver-ui/tests/mock/jobs"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender, _pipeline, _events, _builds, _workflowGraph, _jobs) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | pipeline build', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      const graph = (0, _workflowGraph.default)();
      const jobs = (0, _jobs.default)();
      const pipeline = (0, _pipeline.default)(graph);
      const events = (0, _events.default)(graph);
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/4', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(pipeline)]);
      server.get('http://localhost:8080/v4/pipelines/4/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(jobs)]);
      server.get('http://localhost:8080/v4/pipelines/4/events', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(events)]);
      server.get('http://localhost:8080/v4/pipelines/4/triggers', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
      server.get('http://localhost:8080/v4/events/:eventId/builds', request => {
        const eventId = parseInt(request.params.eventId, 10);
        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify((0, _builds.default)(eventId))];
      });
      server.get('http://localhost:8080/v4/jobs/:jobId/builds', request => {
        const jobId = parseInt(request.params.jobId, 10);
        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify((0, _builds.default)(jobId))];
      });
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/4 when not logged in', async function (assert) {
      await (0, _testHelpers.visit)('/pipelines/4');
      assert.equal((0, _testHelpers.currentURL)(), '/login');
    });
    (0, _qunit.test)('visiting /pipelines/4 when logged in', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/pipelines/4');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/4/events');
      assert.dom('a h1').hasText('foo/bar', 'incorrect pipeline name');
      assert.dom('.pipelineWorkflow svg').exists({
        count: 1
      }, 'not enough workflow');
      assert.dom('button.start-button').exists({
        count: 1
      }, 'should have a start button');
      assert.dom('ul.nav-pills').exists({
        count: 1
      }, 'should show tabs');
      assert.dom('.column-tabs-view .nav-link').hasText('Events');
      assert.dom('.column-tabs-view .nav-link.active').hasText('Events');
      assert.dom('.column-tabs-view .nav-link:not(.active)').hasText('Pull Requests');
      assert.dom('.separator').exists({
        count: 1
      });
      assert.dom('.partial-view').exists({
        count: 2
      });
      await (0, _testHelpers.visit)('/pipelines/4/pulls');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/4/pulls');
      assert.dom('.column-tabs-view .nav-link.active').hasText('Pull Requests');
    });
  });
});
define("screwdriver-ui/tests/acceptance/pipeline-childPipelines-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | child pipeline', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        createTime: '2016-09-15T23:12:23.760Z',
        admins: {
          batman: true
        },
        workflow: ['main', 'publish'],
        childPipelines: {
          scmUrls: ['git@github.com:child/one.git#master', 'git@github.com:child/two.git#master']
        }
      })]);
      server.get('http://localhost:8080/v4/pipelines', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: '2',
        scmUrl: 'git@github.com:child/one.git#master',
        scmRepo: {
          name: 'child/one',
          branch: 'master',
          url: 'https://github.com/child/one'
        }
      }, {
        id: '3',
        scmUrl: 'git@github.com:child/two.git#master',
        scmRepo: {
          name: 'child/two',
          branch: 'master',
          url: 'https://github.com/child/two'
        }
      }])]);
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/:id/child-pipelines', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/pipelines/1/child-pipelines');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/1/child-pipelines');
      assert.dom('.appId:nth-child(1)').hasText('child/one');
      assert.dom('.appId:nth-child(2)').hasText('child/two');
    });
  });
});
define("screwdriver-ui/tests/acceptance/pipeline-options-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | pipeline/options', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        scmUri: 'github.com:84604643:master',
        scmRepo: {
          branch: 'master',
          name: 'foo/bar',
          url: 'https://github.com/foo/bar/tree/master'
        },
        createTime: '2016-09-15T23:12:23.760Z',
        admins: {
          batman: true
        },
        workflow: ['main', 'publish']
      })]);
      server.get('http://localhost:8080/v4/pipelines/1/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 1234,
        name: 'main',
        state: 'ENABLED'
      }, {
        id: 1235,
        name: 'publish',
        state: 'ENABLED'
      }])]);
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/:id/options', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/pipelines/1/options');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/1/options');
      assert.dom('section.pipeline li').exists({
        count: 1
      });
      assert.dom('section.jobs li').exists({
        count: 3
      });
      assert.dom('section.danger li').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/acceptance/pipeline-pr-chain-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender", "screwdriver-ui/tests/mock/pipeline", "screwdriver-ui/tests/mock/events", "screwdriver-ui/tests/mock/builds", "screwdriver-ui/tests/mock/workflow-graph", "screwdriver-ui/tests/mock/jobs"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender, _pipeline, _events, _builds, _workflowGraph, _jobs) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | pipeline pr-chain', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      const graph = (0, _workflowGraph.default)();
      const jobs = (0, _jobs.default)();
      const pipeline = (0, _pipeline.default)(graph);
      const events = (0, _events.default)(graph);
      pipeline.prChain = true;
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/4', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(pipeline)]);
      server.get('http://localhost:8080/v4/pipelines/4/jobs', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(jobs)]);
      server.get('http://localhost:8080/v4/pipelines/4/events', request => {
        const prNum = parseInt(request.queryParams.prNum, 10);
        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify([].concat(events.find(e => e.prNum === prNum)))];
      });
      server.get('http://localhost:8080/v4/events/:eventId/builds', request => {
        const eventId = parseInt(request.params.eventId, 10);
        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify((0, _builds.default)(eventId))];
      });
      server.get('http://localhost:8080/v4/jobs/:jobId/builds', request => {
        const jobId = parseInt(request.params.jobId, 10);
        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify((0, _builds.default)(jobId))];
      });
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/4/pulls when the pipeline is enabled for prChain', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/pipelines/4/pulls');
      assert.dom('a h1').hasText('foo/bar', 'incorrect pipeline name');
      assert.dom('.pipelineWorkflow svg').exists({
        count: 1
      }, 'not enough workflow');
      assert.dom('ul.nav-pills').exists({
        count: 1
      }, 'should show tabs');
      assert.dom('.column-tabs-view .nav-link').hasText('Events');
      assert.dom('.column-tabs-view .nav-link.active').hasText('Pull Requests');
      assert.dom('.column-tabs-view .view .detail .commit').hasText('PR-42');
      assert.dom('.separator').exists({
        count: 1
      });
      assert.dom('.partial-view').exists({
        count: 2
      });
    });
  });
});
define("screwdriver-ui/tests/acceptance/search-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | search', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines', request => {
        if (!request.queryParams.search) {
          return [200, {
            'Content-Type': 'application/json'
          }, JSON.stringify([{
            id: '1',
            scmUrl: 'git@github.com:foo/bar.git#master',
            scmRepo: {
              name: 'foo/bar',
              url: 'git@github.com:foo/bar.git#master',
              branch: 'master'
            },
            scmContext: 'github:github.com',
            createTime: '2016-09-15T23:12:23.760Z',
            admins: {
              batman: true
            },
            workflow: ['main', 'publish']
          }, {
            id: '2',
            scmUrl: 'git@github.com:foo/bar2.git#banana',
            scmRepo: {
              name: 'foo/bar2',
              url: 'git@github.com:foo/bar2.git#master',
              branch: 'master'
            },
            scmContext: 'github:github.com',
            createTime: '2016-09-15T23:12:23.760Z',
            admins: {
              batman: true
            },
            workflow: ['main', 'publish']
          }, {
            id: '3',
            scmUrl: 'git@github.com:foo/bar3.git#cucumber',
            scmRepo: {
              name: 'foo/bar3',
              url: 'git@github.com:foo/bar3.git#master',
              branch: 'master'
            },
            scmContext: 'github:github.com',
            createTime: '2016-09-15T23:12:23.760Z',
            admins: {
              batman: true
            },
            workflow: ['main', 'publish']
          }])];
        }

        if (request.queryParams.search === 'banana') {
          return [200, {
            'Content-Type': 'application/json'
          }, JSON.stringify([{
            id: '1',
            scmUrl: 'git@github.com:banana/bar.git#master',
            scmRepo: {
              name: 'foo/bar',
              url: 'git@github.com:foo/bar.git#master',
              branch: 'master'
            },
            scmContext: 'github:github.com',
            createTime: '2016-09-15T23:12:23.760Z',
            admins: {
              batman: true
            },
            workflow: ['main', 'publish']
          }, {
            id: '2',
            scmUrl: 'git@github.com:banana/bar2.git#banana',
            scmRepo: {
              name: 'foo/bar2',
              url: 'git@github.com:foo/bar2.git#master',
              branch: 'master'
            },
            scmContext: 'github:github.com',
            createTime: '2016-09-15T23:12:23.760Z',
            admins: {
              batman: true
            },
            workflow: ['main', 'publish']
          }])];
        }

        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify([])];
      });
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: '1',
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /search when not logged in', async function (assert) {
      await (0, _testHelpers.visit)('/search');
      assert.equal((0, _testHelpers.currentURL)(), '/login');
    });
    (0, _qunit.test)('visiting /search when logged in', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/search');
      assert.equal((0, _testHelpers.currentURL)(), '/search');
      assert.dom('tr').exists({
        count: 4
      });
      assert.dom('.showMore').hasText('Show more results...');
      assert.dom('.num-results').hasText('Showing 3 result(s)');
      await (0, _testHelpers.click)('.showMore');
      assert.dom('tr').exists({
        count: 7
      });
      assert.dom('.showMore').hasText('Show more results...');
      assert.dom('.num-results').hasText('Showing 6 result(s)');
    });
    (0, _qunit.test)('visiting /search?query=banana when logged in', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/search?query=banana');
      assert.equal((0, _testHelpers.currentURL)(), '/search?query=banana');
      assert.dom('tr').exists({
        count: 3
      });
      assert.dom('.showMore').doesNotExist();
      assert.dom('.num-results').hasText('Showing 2 result(s)');
    });
    (0, _qunit.test)('visiting /search?query=doesnotexist when logged in', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'fakeToken'
      });
      await (0, _testHelpers.visit)('/search?query=doesnotexist');
      assert.equal((0, _testHelpers.currentURL)(), '/search?query=doesnotexist');
      assert.dom('tr').exists({
        count: 1
      });
      assert.dom('.showMore').doesNotExist();
      assert.dom('.num-results').hasText('No results');
    });
  });
});
define("screwdriver-ui/tests/acceptance/secrets-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | secrets', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/pipelines/1', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '1',
        scmUrl: 'git@github.com:foo/bar.git#master',
        createTime: '2016-09-15T23:12:23.760Z',
        admins: {
          batman: true
        },
        workflow: ['main', 'publish']
      })]);
      server.get('http://localhost:8080/v4/pipelines/1/secrets', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 1234,
        name: 'BATMAN',
        value: null,
        allowInPR: false
      }, {
        id: 1235,
        name: 'ROBIN',
        value: null,
        allowInPR: false
      }])]);
      server.get('http://localhost:8080/v4/pipelines/1/tokens', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 2345,
        name: 'foo',
        description: 'foofoo'
      }, {
        id: 2346,
        name: 'bar',
        description: 'barbar'
      }])]);
      server.get('http://localhost:8080/v4/collections', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /pipelines/:id/secrets', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/pipelines/1/secrets');
      assert.equal((0, _testHelpers.currentURL)(), '/pipelines/1/secrets');
      assert.dom('.secrets tbody tr').exists({
        count: 2
      });
      assert.dom('.token-list tbody tr').exists({
        count: 2
      });
    });
  });
});
define("screwdriver-ui/tests/acceptance/tokens-test", ["@ember/test-helpers", "qunit", "ember-qunit", "ember-simple-auth/test-support", "pretender"], function (_testHelpers, _qunit, _emberQunit, _testSupport, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Acceptance | tokens', function (hooks) {
    (0, _emberQunit.setupApplicationTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      server.get('http://localhost:8080/v4/tokens', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: '1',
        name: 'foo',
        description: 'bar',
        lastUsed: '2016-09-15T23:12:23.760Z'
      }, {
        id: '2',
        name: 'baz',
        lastUsed: ''
      }])]);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('visiting /user-settings', async function (assert) {
      await (0, _testSupport.authenticateSession)({
        token: 'faketoken'
      });
      await (0, _testHelpers.visit)('/user-settings');
      assert.dom('.token-list tbody tr').exists({
        count: 2
      });
    });
  });
});
define("screwdriver-ui/tests/components/ember-ace", ["exports", "ember-ace/test-support/components/ember-ace"], function (_exports, _emberAce) {
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
define("screwdriver-ui/tests/helpers/ember-simple-auth", ["exports", "ember-simple-auth/authenticators/test"], function (_exports, _test) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.authenticateSession = authenticateSession;
  _exports.currentSession = currentSession;
  _exports.invalidateSession = invalidateSession;
  const TEST_CONTAINER_KEY = 'authenticator:test';

  function ensureAuthenticator(app, container) {
    const authenticator = container.lookup(TEST_CONTAINER_KEY);

    if (!authenticator) {
      app.register(TEST_CONTAINER_KEY, _test.default);
    }
  }

  function authenticateSession(app, sessionData) {
    const {
      __container__: container
    } = app;
    const session = container.lookup('service:session');
    ensureAuthenticator(app, container);
    session.authenticate(TEST_CONTAINER_KEY, sessionData);
    return app.testHelpers.wait();
  }

  function currentSession(app) {
    return app.__container__.lookup('service:session');
  }

  function invalidateSession(app) {
    const session = app.__container__.lookup('service:session');

    if (session.get('isAuthenticated')) {
      session.invalidate();
    }

    return app.testHelpers.wait();
  }
});
define("screwdriver-ui/tests/helpers/inject-scm", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = injectScmServiceStub;
  const scms = [{
    context: 'github:github.com',
    displayName: 'github.com',
    iconType: 'github',
    isSignedIn: true
  }, {
    context: 'bitbucket:bitbucket.org',
    displayName: 'bitbucket.org',
    iconType: 'bitbucket',
    isSignedIn: false
  }];
  /**
   * Inject scm service to an Ember Object
   * @param {Object}    self      - Ember object generated by ember-qunit moduleFor()
   */

  function injectScmServiceStub(self) {
    const scmServiceStub = Ember.Service.extend({
      createScms() {
        return Ember.RSVP.resolve(scms);
      },

      getScms() {
        return scms;
      },

      getScm(scmContext) {
        return this.getScms().find(scm => scm.context === scmContext);
      }

    });
    self.owner.register('service:scm', scmServiceStub);
  }
});
define("screwdriver-ui/tests/helpers/inject-session", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = injectSessionStub;

  /**
   * Inject session service to an Ember Object
   * @param {Object} self - Ember object generated by ember-qunit moduleFor()
   */
  function injectSessionStub(self) {
    const sessionStub = Ember.Service.extend({
      isAuthenticated() {
        return true;
      }

    });
    self.owner.register('service:session', sessionStub);
  }
});
define("screwdriver-ui/tests/helpers/responsive", ["exports", "ember-responsive/media"], function (_exports, _media) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.setBreakpointForIntegrationTest = setBreakpointForIntegrationTest;
  _exports.default = void 0;

  _media.default.reopen({
    // Change this if you want a different default breakpoint in tests.
    _defaultBreakpoint: 'desktop',
    _breakpointArr: Ember.computed('breakpoints', function () {
      return Object.keys(this.get('breakpoints')) || Ember.A([]);
    }),

    _forceSetBreakpoint(breakpoint) {
      let found = false;
      const props = {};
      this.get('_breakpointArr').forEach(function (bp) {
        const val = bp === breakpoint;

        if (val) {
          found = true;
        }

        props["is".concat(Ember.String.classify(bp))] = val;
      });

      if (found) {
        this.setProperties(props);
      } else {
        throw new Error("You tried to set the breakpoint to ".concat(breakpoint, ", which is not in your app/breakpoint.js file."));
      }
    },

    match() {},

    // do not set up listeners in test
    init() {
      this._super(...arguments);

      this._forceSetBreakpoint(this.get('_defaultBreakpoint'));
    }

  });

  var _default = Ember.Test.registerAsyncHelper('setBreakpoint', function (app, breakpoint) {
    // this should use getOwner once that's supported
    const mediaService = app.__deprecatedInstance__.lookup('service:media');

    mediaService._forceSetBreakpoint(breakpoint);
  });

  _exports.default = _default;

  function setBreakpointForIntegrationTest(container, breakpoint) {
    const mediaService = Ember.getOwner(container).lookup('service:media');

    mediaService._forceSetBreakpoint(breakpoint);

    container.set('media', mediaService);
    return mediaService;
  }
  /* eslint-enable */

});
define("screwdriver-ui/tests/integration/components/app-header/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-scm"], function (_qunit, _emberQunit, _testHelpers, _injectScm) {
  "use strict";

  (0, _qunit.module)('Integration | Component | app header', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks); // this test should pass when search bar feature flag is turned off

    (0, _qunit.test)('it renders when search flag is off', async function (assert) {
      this.set('sessionMock', {
        isAuthenticated: false
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "w3ZrbcpJ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"session\"],[[25,[\"sessionMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.logo').hasAttribute('title', 'Screwdriver Home');
      assert.dom('.icon.create').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.icon.docs-outline');
      assert.dom('.icon.docs').exists({
        count: 1
      });
      assert.dom('.icon.validator').exists({
        count: 1
      });
      assert.dom('.icon.templates').exists({
        count: 1
      });
      assert.dom('.icon.commands').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.icon.comm-outline');
      assert.dom('.icon.blog').exists({
        count: 1
      });
      assert.dom('.icon.community').exists({
        count: 1
      });
      assert.dom('.icon.github').exists({
        count: 1
      });
      assert.dom('.icon.profile-outline').exists({
        count: 1
      });
      assert.dom('.icon.profile-outline').hasAttribute('title', 'Sign in to Screwdriver');
      assert.dom('.search-input').doesNotExist();
    });
    (0, _qunit.test)('it shows user github username', async function (assert) {
      assert.expect(2);
      this.set('sessionMock', {
        isAuthenticated: true,
        data: {
          authenticated: {
            username: 'foofoo'
          }
        }
      });
      this.set('invalidateSession', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "LUWvJPAu",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"session\",\"onInvalidate\"],[[25,[\"sessionMock\"]],[29,\"action\",[[24,0,[]],[25,[\"invalidateSession\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.profile-outline > .icontitle').hasText('foofoo');
      await (0, _testHelpers.click)('.icon.profile-outline');
      await (0, _testHelpers.click)('.logout');
    });
    (0, _qunit.test)('it calls the logout method on logout', async function (assert) {
      assert.expect(2);
      this.set('sessionMock', {
        isAuthenticated: true
      });
      this.set('invalidateSession', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "LUWvJPAu",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"session\",\"onInvalidate\"],[[25,[\"sessionMock\"]],[29,\"action\",[[24,0,[]],[25,[\"invalidateSession\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('.icon.profile-outline');
      assert.dom('.logout').hasAttribute('title', 'Sign out of Screwdriver');
      await (0, _testHelpers.click)('.logout');
    });
    (0, _qunit.test)('it shows scm list and which scm is signed in', async function (assert) {
      assert.expect(3);
      (0, _injectScm.default)(this);
      this.set('sessionMock', {
        isAuthenticated: true
      });
      this.set('scmMock', this.owner.lookup('service:scm').getScms());
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "TJinrgDH",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"session\",\"scmContexts\"],[[25,[\"sessionMock\"]],[25,[\"scmMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('.icon.profile-outline');
      assert.dom('span.title').hasText('ACCOUNTS');
      assert.dom('a.active').hasText('github.com active');
      assert.dom('a.active > .fa-github').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it shows the search bar', async function (assert) {
      this.set('sessionMock', {
        isAuthenticated: false
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "kcKr5oAK",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"session\",\"showSearch\"],[[25,[\"sessionMock\"]],true]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.search-input').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it navigates to search page upon clicking the search button', async function (assert) {
      this.set('search', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3TJoiSwG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"app-header\",null,[[\"showSearch\",\"searchPipelines\"],[true,[29,\"action\",[[24,0,[]],[25,[\"search\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.search-input').hasNoValue();
      await (0, _testHelpers.click)('.search-button');
    });
  });
});
define("screwdriver-ui/tests/integration/components/artifact-tree/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const parsedManifest = [{
    text: 'coverage',
    type: 'directory',
    children: [{
      text: 'coverage.json',
      type: 'file',
      a_attr: {
        href: 'http://foo.com/coverage.json'
      }
    }]
  }, {
    text: 'test.txt',
    type: 'file',
    a_attr: {
      href: 'http://foo.com/test.txt'
    }
  }];
  const artifactService = Ember.Service.extend({
    fetchManifest() {
      return Ember.RSVP.resolve(parsedManifest);
    }

  });
  (0, _qunit.module)('Integration | Component | artifact tree', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.owner.register('service:build-artifact', artifactService);
    });
    (0, _qunit.test)('it renders only title when build is running', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Vhng4u/a",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"artifact-tree\",null,[[\"buildStatus\"],[\"RUNNING\"]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.artifact-tree h4').hasText('Artifacts');
      assert.dom('.jstree-node').doesNotExist();
    });
    (0, _qunit.test)('it renders with artifacts if build finished', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JxjxfyJF",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"artifact-tree\",null,[[\"buildStatus\"],[\"SUCCESS\"]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(async () => {
        // Check if it has two nodes and one of them is a leaf/file
        assert.dom('.jstree-leaf').exists({
          count: 1
        });
        assert.dom('.jstree-node').exists({
          count: 2
        }); // Check if the href is correctly set and then click the link

        assert.equal((0, _testHelpers.find)('.jstree-leaf a').href, parsedManifest[1].a_attr.href);
        await (0, _testHelpers.click)('.jstree-leaf a');
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/bread-crumbs/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const TEST_TEMPLATES = [{
    name: 'Templates',
    params: ['templates']
  }, {
    name: 'Test-Namespace',
    params: ['templates.namespace', 'Test-Namespace']
  }, {
    name: 'Test-Name',
    params: ['templates.detail', 'Test-Namespace', 'Test-Name']
  }];
  (0, _qunit.module)('Integration | Component | bread crumbs', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('mocks', TEST_TEMPLATES);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "B39Fpgzj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"bread-crumbs\",null,[[\"crumbs\"],[[25,[\"mocks\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('div a').exists({
        count: 2
      });
      assert.dom('div a:first-of-type').hasText('Templates');
      assert.dom('div a:last-of-type').hasText('Test-Namespace');
    });
  });
});
define("screwdriver-ui/tests/integration/components/build-banner/component-test", ["moment", "qunit", "ember-qunit", "@ember/test-helpers", "ember-sinon-qunit/test-support/test"], function (_moment, _qunit, _emberQunit, _testHelpers, _test) {
  "use strict";

  const coverageService = Ember.Service.extend({
    getCoverageInfo() {
      return Ember.RSVP.resolve({
        coverage: '98%',
        coverageUrl: 'http://example.com/coverage/123',
        tests: '7/10',
        testsUrl: 'http://example.com/coverage/123'
      });
    }

  });
  const buildStepsMock = [{
    name: 'sd-setup-screwdriver-scm-bookend'
  }];
  const eventMock = Ember.Object.create({
    id: 'abcd',
    causeMessage: 'Merged by batman',
    commit: {
      message: 'Merge pull request #2 from batcave/batmobile',
      author: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
    },
    truncatedMessage: 'Merge it',
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    },
    pr: {
      url: 'https://github.com/screwdriver-cd/ui/pull/292'
    },
    pipelineId: '12345',
    sha: 'abcdef1029384',
    truncatedSha: 'abcdef1',
    type: 'pipelineId',
    workflow: ['main', 'publish'],
    builds: ['build1', 'build2']
  });
  const buildMock = Ember.Object.create({
    eventId: 'abcd',
    id: '2'
  });
  const buildMetaMock = {
    tests: {
      coverage: '100',
      results: '10/10'
    }
  };
  (0, _qunit.module)('Integration | Component | build banner', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.owner.register('service:coverage', coverageService);
    });
    (0, _test.default)('it renders', async function (assert) {
      assert.expect(11);
      this.set('reloadCb', () => {
        assert.ok(true);
      });
      this.set('changeB', () => {
        assert.ok(true);
      });
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      this.set('buildStepsMock', buildStepsMock);
      this.set('eventMock', eventMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "/ReAL2Ur",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"blockDuration\",\"imagePullDuration\",\"buildDuration\",\"buildStatus\",\"buildCreate\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"reloadBuild\",\"changeBuild\"],[\"node:6\",\"11 seconds\",\"4 seconds\",\"5 seconds\",\"2 seconds\",\"RUNNING\",\"2016-11-04T20:08:41.238Z\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"PR-671\",false,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null],[29,\"action\",[[24,0,[]],[25,[\"changeB\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const expectedTime = (0, _moment.default)('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');
      assert.dom('li.job-name .banner-value').hasText('PR-671');
      assert.dom('.commit a').hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
      assert.dom('.commit a').hasText('#abcdef1');
      assert.dom('.duration .banner-value').hasAttribute('title', 'Total duration: 11 seconds, Blocked time: 4 seconds, Image pull time: 5 seconds, Build time: 2 seconds');
      assert.dom('.duration > a').hasText('See build metrics');
      assert.dom('.created .banner-value').hasText(expectedTime);
      assert.dom('.user .banner-value').hasText('Bruce W');
      assert.dom('.docker-container .banner-value').hasText('node:6');
      assert.dom('button').doesNotExist();
    });
    (0, _test.default)('it renders pr link if pr url info is available', async function (assert) {
      assert.expect(12);
      this.set('reloadCb', () => {
        assert.ok(true);
      });
      this.set('buildStepsMock', buildStepsMock);
      this.set('eventMock', eventMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ciJ3amty",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"blockDuration\",\"imagePullDuration\",\"buildDuration\",\"buildStatus\",\"buildCreate\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"reloadBuild\"],[\"node:6\",\"5 seconds\",\"0 seconds\",\"0 seconds\",\"0 seconds\",\"RUNNING\",\"2016-11-04T20:08:41.238Z\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"PR-671\",false,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const expectedTime = (0, _moment.default)('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');
      assert.dom('.pr .pr-url-holder a').hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
      assert.dom('.pr .pr-url-holder a').hasText('PR#292');
      assert.dom('li.job-name .banner-value').hasText('PR-671');
      assert.dom('.commit a').hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
      assert.dom('.commit a').hasText('#abcdef1');
      assert.dom('.duration .banner-value').hasAttribute('title', 'Total duration: 5 seconds, Blocked time: 0 seconds, Image pull time: 0 seconds, Build time: 0 seconds');
      assert.dom('.created .banner-value').hasText(expectedTime);
      assert.dom('.user .banner-value').hasText('Bruce W');
      assert.dom('.docker-container .banner-value').hasText('node:6');
      assert.dom('button').doesNotExist();
    });
    (0, _test.default)('it renders prCommit dropdown if event type is pr', async function (assert) {
      assert.expect(16);
      this.set('reloadCb', () => {
        assert.ok(true);
      });
      this.set('buildStepsMock', buildStepsMock);
      this.set('eventMock', eventMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([{
        build: buildMock,
        event: eventMock
      }])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ciJ3amty",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"blockDuration\",\"imagePullDuration\",\"buildDuration\",\"buildStatus\",\"buildCreate\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"reloadBuild\"],[\"node:6\",\"5 seconds\",\"0 seconds\",\"0 seconds\",\"0 seconds\",\"RUNNING\",\"2016-11-04T20:08:41.238Z\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"PR-671\",false,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const expectedTime = (0, _moment.default)('2016-11-04T20:08:41.238Z').format('YYYY-MM-DD HH:mm:ss');
      assert.dom('.pr .pr-url-holder a').hasAttribute('href', 'https://github.com/screwdriver-cd/ui/pull/292');
      assert.dom('.pr .pr-url-holder a').hasText('PR#292');
      assert.dom('li.job-name .banner-value').hasText('PR-671');
      assert.dom('.commit a').hasAttribute('href', 'http://example.com/batcave/batmobile/commit/abcdef1029384');
      assert.dom('.commit .commit-sha').hasText('#abcdef1');
      await (0, _testHelpers.click)('.commit .dropdown-toggle');
      assert.dom('.commit .pr-item a').hasText('1. abcdef1');
      assert.dom('.duration .banner-value').hasAttribute('title', 'Total duration: 5 seconds, Blocked time: 0 seconds, Image pull time: 0 seconds, Build time: 0 seconds');
      assert.dom('.created .banner-value').hasText(expectedTime);
      assert.dom('.user .banner-value').hasText('Bruce W');
      assert.dom('.docker-container .banner-value').hasText('node:6');
      assert.dom('button').doesNotExist();
    });
    (0, _test.default)('it renders a restart button for completed jobs when authenticated', async function (assert) {
      assert.expect(3);
      const reloadBuildSpy = this.spy();
      this.set('buildStepsMock', buildStepsMock);
      this.set('reloadCb', reloadBuildSpy);
      this.set('externalStart', () => {
        assert.ok(true);
      });
      this.set('eventMock', eventMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "yn48yO2W",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"onStart\",\"reloadBuild\"],[\"node:6\",\"5 seconds\",\"ABORTED\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"PR-671\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"externalStart\"]]],null],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('button').hasText('Restart');
      assert.notOk(reloadBuildSpy.called);
      await (0, _testHelpers.click)('button');
    });
    (0, _test.default)('it renders a stop button for running job when authenticated', async function (assert) {
      assert.expect(4);
      this.set('willRender', () => {
        assert.ok(true);
      });
      this.set('externalStop', () => {
        assert.ok(true);
      });
      this.set('buildStepsMock', buildStepsMock);
      this.set('eventMock', eventMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "2Rfiqr8w",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"onStop\",\"reloadBuild\"],[\"node:6\",\"5 seconds\",\"RUNNING\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"externalStop\"]]],null],[29,\"action\",[[24,0,[]],[25,[\"willRender\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('button').hasText('Stop');
      await (0, _testHelpers.click)('button');
    });
    (0, _test.default)('it renders a stop button for blocked job when authenticated', async function (assert) {
      assert.expect(4);
      this.set('willRender', () => {
        assert.ok(true);
      });
      this.set('externalStop', () => {
        assert.ok(true);
      });
      this.set('buildStepsMock', buildStepsMock);
      this.set('eventMock', eventMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "zHqmMXwm",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\",\"onStop\",\"reloadBuild\"],[\"node:6\",\"5 seconds\",\"BLOCKED\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]],[29,\"action\",[[24,0,[]],[25,[\"externalStop\"]]],null],[29,\"action\",[[24,0,[]],[25,[\"willRender\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('button').hasText('Stop');
      await (0, _testHelpers.click)('button');
    });
    (0, _test.default)('it renders coverage info if coverage step finished', async function (assert) {
      const coverageStepsMock = [{
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      }, {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }];
      assert.expect(4);
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', coverageStepsMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "xuCcYy0z",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"SUCCESS\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.coverage .banner-value').hasText('98%');
        assert.dom('.tests .banner-value').hasText('7/10');
        assert.dom('.coverage a').hasAttribute('href', 'http://example.com/coverage/123');
        assert.dom('.tests a').hasAttribute('href', 'http://example.com/coverage/123');
      });
    });
    (0, _test.default)('it renders default coverage info if coverage step has not finished', async function (assert) {
      const coverageStepsMock = [{
        name: 'sd-setup-screwdriver-scm-bookend'
      }, {
        name: 'sd-teardown-screwdriver-coverage-bookend'
      }];
      assert.expect(7);
      this.set('reloadCb', () => {
        assert.ok(true);
      });
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', coverageStepsMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "CDg7xESV",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"reloadBuild\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"RUNNING\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('button').hasText('Stop');
        assert.dom('.coverage .banner-value').hasText('N/A');
        assert.dom('.tests .banner-value').hasText('N/A');
        assert.dom('.coverage a').hasAttribute('title', 'Coverage report not generated');
        assert.dom('.tests a').hasAttribute('title', 'Tests report not generated');
      });
    });
    (0, _test.default)('it overrides coverage info if it is set in build meta', async function (assert) {
      const coverageStepsMock = [{
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      }, {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }];
      assert.expect(2);
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', coverageStepsMock);
      this.set('buildMetaMock', buildMetaMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "INRozGKg",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"buildMeta\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"SUCCESS\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],[25,[\"buildMetaMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.coverage .banner-value').hasText('100%');
        assert.dom('.tests .banner-value').hasText('10/10');
      });
    });
    (0, _test.default)('it does not override coverage info if build meta format is not correct', async function (assert) {
      const coverageStepsMock = [{
        name: 'sd-setup-screwdriver-scm-bookend',
        startTime: '2016-11-04T20:09:41.238Z'
      }, {
        name: 'sd-teardown-screwdriver-coverage-bookend',
        endTime: '2016-11-04T21:09:41.238Z'
      }];
      buildMetaMock.tests = {
        coverage: 'nonsense',
        resulst: 'nonsense'
      };
      assert.expect(2);
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', coverageStepsMock);
      this.set('buildMetaMock', buildMetaMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "INRozGKg",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"buildMeta\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"SUCCESS\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],[25,[\"buildMetaMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.coverage .banner-value').hasText('98%');
        assert.dom('.tests .banner-value').hasText('7/10');
      });
    });
    (0, _test.default)('it does not render coverage info if there is no coverage step', async function (assert) {
      assert.expect(1);
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', buildStepsMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "xuCcYy0z",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"SUCCESS\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('li').doesNotHaveClass('coverage');
      });
    });
    (0, _test.default)('it should show the stop button for a running UNSTABLE build', async function (assert) {
      const coverageStepsMock = [{
        name: 'sd-setup-screwdriver-scm-bookend'
      }, {
        name: 'sd-teardown-screwdriver-coverage-bookend'
      }];
      assert.expect(3);
      this.set('reloadCb', () => {
        assert.ok(true);
      });
      this.set('eventMock', eventMock);
      this.set('buildStepsMock', coverageStepsMock);
      this.set('prEvents', new Ember.RSVP.Promise(resolves => resolves([])));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "pSV1IVdM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-banner\",null,[[\"buildContainer\",\"duration\",\"buildId\",\"buildStatus\",\"buildStart\",\"buildSteps\",\"jobId\",\"jobName\",\"isAuthenticated\",\"event\",\"reloadBuild\",\"prEvents\"],[\"node:6\",\"5 seconds\",123,\"UNSTABLE\",\"2016-11-04T20:09:41.238Z\",[25,[\"buildStepsMock\"]],1,\"main\",true,[25,[\"eventMock\"]],[29,\"action\",[[24,0,[]],[25,[\"reloadCb\"]]],null],[25,[\"prEvents\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('button').hasText('Stop');
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/build-log/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "moment", "sinon"], function (_qunit, _emberQunit, _testHelpers, _moment, _sinon) {
  "use strict";

  const startTime = 1478912844724;

  const doneStub = _sinon.default.stub();

  const logsStub = _sinon.default.stub();

  const blobUrl = 'blob:https://localhost/34dba0dc-2706-4cae-a74f-99349a578e60';
  const sampleLogs = Array(100).fill().map((_, i) => ({
    m: "".concat(startTime + i),
    n: i + 1,
    t: startTime + i
  }));
  const logService = Ember.Service.extend({
    fetchLogs() {
      return Ember.RSVP.resolve({
        lines: this.getCache('logs'),
        done: this.getCache('done')
      });
    },

    resetCache() {},

    getCache() {
      const lastArg = arguments[arguments.length - 1];

      if (lastArg === 'logs') {
        return logsStub();
      }

      if (lastArg === 'done') {
        return doneStub();
      }

      return 100;
    },

    buildLogBlobUrl() {
      return blobUrl;
    },

    revokeLogBlobUrls() {}

  });
  (0, _qunit.module)('Integration | Component | build log', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.owner.register('service:build-logs', logService);
      doneStub.onCall(0).returns(true);
      doneStub.onCall(1).returns(false);
      logsStub.onCall(0).returns(sampleLogs);
      logsStub.onCall(1).returns(sampleLogs);
      logsStub.returns(sampleLogs.concat(sampleLogs));
    });
    hooks.afterEach(function () {
      doneStub.reset();
      logsStub.reset();
    });
    (0, _qunit.test)('it displays some help when no step is selected', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "iIgU3c5G",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"stepStartTime\",\"buildStartTime\"],[null,1,null,\"1478912844724\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.logs').includesText('Click a step to see logs'); // Template block usage:

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "+jiWRG6g",
        "block": "{\"symbols\":[],\"statements\":[[4,\"build-log\",null,[[\"stepName\",\"buildId\",\"stepStartTime\",\"buildStartTime\"],[null,1,null,\"1478912844724\"]],{\"statements\":[[0,\"    template block text\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).includesText('template block text');
      assert.dom(this.element).includesText('Click a step to see logs');
    });
    (0, _qunit.test)('it starts loading when step chosen', async function (assert) {
      this.set('step', null);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "9iSQT8z5",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"stepStartTime\",\"buildStartTime\"],[[25,[\"step\"]],1,null,\"1478912844724\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.logs').hasText('Click a step to see logs');
      this.set('step', 'banana');
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').hasText("".concat((0, _moment.default)(startTime).format('HH:mm:ss'), " ").concat(startTime));
        assert.dom('.line:last-child').hasText("".concat((0, _moment.default)(startTime + 99).format('HH:mm:ss'), " ").concat(startTime + 99));
      });
    });
    (0, _qunit.test)('it generate logs for init step', async function (assert) {
      this.set('stats', {
        queueEnterTime: '2019-01-14T20:10:41.238Z',
        imagePullStartTime: '2019-01-14T20:11:41.238Z',
        hostname: 'node12.foo.bar.com'
      });
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GGvYBGZQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"buildStartTime\",\"stepStartTime\",\"stepEndTime\",\"buildStats\"],[[25,[\"step\"]],1,\"2019-01-14T20:12:41.238Z\",\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",[25,[\"stats\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:nth-child(2)').includesText('Build enqueued');
        assert.dom('.line:nth-child(3)').includesText('Build scheduled on node12.foo.bar.com');
        assert.dom('.line:last-child').includesText('Image pull completed');
      });
    });
    (0, _qunit.test)('it generate logs for init step when build is blocked', async function (assert) {
      this.set('stats', {
        queueEnterTime: '2019-01-14T20:10:41.238Z',
        blockedStartTime: '2019-01-14T20:10:42.238Z',
        imagePullStartTime: '2019-01-14T20:11:41.238Z',
        hostname: 'node12.foo.bar.com'
      });
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GGvYBGZQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"buildStartTime\",\"stepStartTime\",\"stepEndTime\",\"buildStats\"],[[25,[\"step\"]],1,\"2019-01-14T20:12:41.238Z\",\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",[25,[\"stats\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:nth-child(2)').includesText('Build enqueued');
        assert.dom('.line:nth-child(3)').includesText('Build blocked, putting back into queue');
        assert.dom('.line:nth-child(4)').includesText('Build scheduled on node12.foo.bar.com');
        assert.dom('.line:last-child').includesText('Image pull completed');
      });
    });
    (0, _qunit.test)('it generate logs for COLLAPSED build', async function (assert) {
      this.set('stats', {
        queueEnterTime: '2019-01-14T20:10:41.238Z'
      });
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "0RfCMJT/",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"buildStartTime\",\"stepStartTime\",\"stepEndTime\",\"buildStats\",\"buildStatus\"],[[25,[\"step\"]],1,\"2019-01-14T20:12:41.238Z\",\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",[25,[\"stats\"]],\"COLLAPSED\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:last-child').includesText('Build collapsed and removed from the queue.');
      });
    });
    (0, _qunit.test)('it generate logs for FROZEN build', async function (assert) {
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "B8JqfsCU",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"buildStartTime\",\"stepStartTime\",\"stepEndTime\",\"buildStats\",\"buildStatus\"],[[25,[\"step\"]],1,\"2019-01-14T20:12:41.238Z\",\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",[25,[\"stats\"]],\"FROZEN\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:last-child').includesText('Build frozen and removed from the queue.');
      });
    });
    (0, _qunit.test)('it generate logs for failed init step', async function (assert) {
      this.set('stats', {
        queueEnterTime: '2019-01-14T20:10:41.238Z',
        imagePullStartTime: '2019-01-14T20:11:41.238Z',
        hostname: 'node12.foo.bar.com'
      });
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UTmbK/h+",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"stepStartTime\",\"stepEndTime\",\"buildStartTime\",\"buildStats\"],[[25,[\"step\"]],1,\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",\"\",[25,[\"stats\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:nth-child(2)').includesText('Build enqueued');
        assert.dom('.line:nth-child(3)').includesText('Build scheduled on node12.foo.bar.com');
        assert.dom('.line:last-child').includesText('Build init failed');
      });
    });
    (0, _qunit.test)('it generate logs for init step with empty build stats', async function (assert) {
      this.set('stats', {});
      this.set('step', 'sd-setup-init');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GGvYBGZQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"buildId\",\"buildStartTime\",\"stepStartTime\",\"stepEndTime\",\"buildStats\"],[[25,[\"step\"]],1,\"2019-01-14T20:12:41.238Z\",\"2019-01-14T20:09:41.238Z\",\"2019-01-14T20:12:41.238Z\",[25,[\"stats\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      return (0, _testHelpers.settled)().then(() => {
        assert.dom('.line:first-child').includesText('Build created');
        assert.dom('.line:last-child').includesText('Build init done');
      });
    });
    (0, _qunit.test)('it starts fetching more log for a chosen completed step', async function (assert) {
      doneStub.onCall(0).returns(false);
      doneStub.onCall(1).returns(false);
      doneStub.onCall(2).returns(true);
      doneStub.onCall(3).returns(true);
      this.set('step', null);
      this.set('scrollStill', _sinon.default.stub());
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3gvmp+md",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"totalLine\",\"buildId\",\"stepStartTime\",\"buildStartTime\"],[[25,[\"step\"]],1000,1,null,\"1478912844724\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.logs').hasText('Click a step to see logs');
      this.set('step', 'banana');
      const container = (0, _testHelpers.find)('.wrap');
      const lastScrollTop = container.scrollTop;
      container.scrollTop = 0;
      return (0, _testHelpers.settled)().then(() => {
        _sinon.default.assert.called(doneStub);

        _sinon.default.assert.called(logsStub);

        assert.ok(container.scrollTop > lastScrollTop);
      });
    });
    (0, _qunit.test)('it generates object url for the log when clicking download button', async function (assert) {
      this.set('step', 'banana');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3gvmp+md",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-log\",null,[[\"stepName\",\"totalLine\",\"buildId\",\"stepStartTime\",\"buildStartTime\"],[[25,[\"step\"]],1000,1,null,\"1478912844724\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom((0, _testHelpers.find)('#downloadLink').previousElementSibling).hasText('Download');
      await (0, _testHelpers.click)((0, _testHelpers.find)('#downloadLink').previousElementSibling);
      assert.dom('#downloadLink').hasAttribute('href', blobUrl);
    });
  });
});
define("screwdriver-ui/tests/integration/components/build-step-collection/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const logService = Ember.Service.extend({
    fetchLogs() {
      return Ember.RSVP.resolve({
        lines: [],
        done: true
      });
    },

    resetCache() {},

    getCache() {
      return [];
    }

  });
  const artifactService = Ember.Service.extend({
    fetchManifest() {
      return Ember.RSVP.resolve();
    }

  });
  (0, _qunit.module)('Integration | Component | build step collection', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.owner.register('service:build-logs', logService);
      this.owner.register('service:build-artifact', artifactService);
    });
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('stepList', []);
      this.set('buildSteps', []);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "t1S1HR9O",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-collection\",null,[[\"stepList\",\"buildStatus\",\"buildId\",\"buildSteps\",\"buildStart\"],[[25,[\"stepList\"]],\"SUCCESS\",1,[25,[\"buildSteps\"]],null]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h3').hasText('Steps');
      assert.dom('.step-list a:nth-of-type(1)').hasText('Setup');
      assert.dom('.step-list a:nth-of-type(2)').hasText('Teardown');
      assert.dom('.setup-spinner').doesNotExist();
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "T6C9/08M",
        "block": "{\"symbols\":[],\"statements\":[[4,\"build-step-collection\",null,[[\"stepList\",\"buildStatus\",\"buildId\",\"buildSteps\",\"buildStart\"],[[25,[\"stepList\"]],\"SUCCESS\",1,[25,[\"buildSteps\"]],null]],{\"statements\":[[0,\"      \"],[7,\"div\"],[11,\"class\",\"hello\"],[9],[0,\"hello\"],[10],[0,\"\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.hello').hasText('hello');
    });
    (0, _qunit.test)('it has a list of steps and can preselect and expand a step', async function (assert) {
      const stepList = ['sd-setup-step1', 'sd-setup-step2', 'sd-setup-step3', 'user-step1', 'user-step2', 'user-step3', 'user-step4', 'sd-teardown-step1', 'sd-teardown-step2'];
      this.set('stepList', stepList);
      this.set('buildSteps', stepList.map(name => ({
        name,
        startTime: new Date(),
        endTime: new Date(),
        code: 0
      })));
      this.set('preselectedStepName', 'user-step2');
      this.set('changeBuildStep', () => {});
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "qE2DOjR6",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-collection\",null,[[\"preselectedStepName\",\"stepList\",\"buildStatus\",\"buildId\",\"buildSteps\",\"buildStart\",\"changeBuildStep\"],[[25,[\"preselectedStepName\"]],[25,[\"stepList\"]],\"SUCCESS\",1,[25,[\"buildSteps\"]],null,[29,\"action\",[[24,0,[]],[25,[\"changeBuildStep\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h3').hasText('Steps');
      assert.dom('.step-list ul.setup li').exists({
        count: 3
      });
      assert.dom('.step-list div.user-steps li').exists({
        count: 4
      });
      assert.dom('.step-list ul.teardown li').exists({
        count: 2
      });
      assert.dom('.step-list div.user-steps li:nth-child(2)').hasClass('active');
    });
  });
});
define("screwdriver-ui/tests/integration/components/build-step-item/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | build step item', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders and calls click handler', async function (assert) {
      assert.expect(4);
      this.set('mockClick', name => assert.equal(name, 'monkey'));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "7hCFcH0t",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\",\"stepEnd\",\"stepCode\",\"onClick\"],[\"banana\",\"monkey\",\"2016-08-26T20:50:51.531Z\",\"2016-08-26T20:50:52.531Z\",0,[29,\"action\",[[24,0,[]],[25,[\"mockClick\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.name').hasText('monkey');
      assert.dom('i.fa').hasClass('fa-check', 'success icon');
      assert.dom('.duration').hasText('1 second');
      await (0, _testHelpers.click)('.name');
    });
    (0, _qunit.test)('it renders an X when failed', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "OfakqddA",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\",\"stepEnd\",\"stepCode\"],[\"banana\",\"monkey\",\"2016-08-26T20:50:51.531Z\",\"2016-08-26T20:50:52.531Z\",128]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('i.fa').hasClass('fa-times', 'fail icon');
    });
    (0, _qunit.test)('it renders an O when not run', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "tfIv75Fo",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\"],[\"banana\",\"monkey\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('i.fa').hasClass('fa-circle-o', 'empty icon');
    });
    (0, _qunit.test)('it renders an spinner when running', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cYVPvsPC",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"build-step-item\",null,[[\"selectedStep\",\"stepName\",\"stepStart\"],[\"banana\",\"monkey\",\"2016-08-26T20:50:51.531Z\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('i.fa').hasClass('fa-spinner', 'spin icon');
    });
  });
});
define("screwdriver-ui/tests/integration/components/chart-c3/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | chart c3', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('data', {
        columns: []
      });
      this.set('oninit', () => {
        assert.ok(this);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "4d/MapbO",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"chart-c3\",null,[[\"name\",\"data\",\"oninit\"],[\"test-chart\",[25,[\"data\"]],[25,[\"oninit\"]]]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('svg').exists({
        count: 1
      });
      assert.dom('.c3-circle').doesNotExist();
      assert.dom('.c3-event-rect').exists({
        count: 1
      });
      this.set('data', {
        columns: [['data', 1]]
      });
      assert.dom('.c3-circle').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/collection-dropdown/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session", "screwdriver-ui/tests/helpers/inject-scm"], function (_qunit, _emberQunit, _testHelpers, _injectSession, _injectScm) {
  "use strict";

  const mockCollection = {
    id: 1,
    name: 'Test',
    description: 'Test description',
    get: name => name
  };
  (0, _qunit.module)('Integration | Component | collection add button', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('collections', [Ember.Object.create(mockCollection)]);
      this.set('pipeline', {
        id: 1
      });
      this.set('onAddToCollection', true);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "hY7kLVda",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-dropdown\",null,[[\"collections\",\"pipeline\",\"onAddToCollection\"],[[25,[\"collections\"]],[25,[\"pipeline\"]],[25,[\"onAddToCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      })); // the button should be there

      assert.dom('.dropdown-toggle').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.dropdown-toggle'); // there should be two list items ('Test' and 'CREATE')

      assert.dom('.dropdown-menu > li').exists({
        count: 2
      }); // Validate that list items exist

      assert.dom('.dropdown-menu > li:nth-child(1)').hasText('Test');
      assert.dom('.dropdown-menu > li:nth-child(2)').hasText('CREATE');
    });
    (0, _qunit.test)('it adds a pipeline to a collection', async function (assert) {
      assert.expect(2);
      (0, _injectSession.default)(this);
      (0, _injectScm.default)(this);
      const pipelines = [Ember.Object.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }), Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      const collections = [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [2, 3]
      }), Ember.Object.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: []
      })];

      const addToCollectionMock = (pipelineId, collectionId) => {
        assert.strictEqual(pipelineId, 2);
        assert.strictEqual(collectionId, 1);
        return Ember.RSVP.resolve({
          id: 1,
          name: 'collection1',
          description: 'description1',
          pipelineIds: [1, 2, 3]
        });
      };

      this.set('pipelineList', pipelines);
      this.set('collections', collections);
      this.set('addToCollection', addToCollectionMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "QsaLxzHR",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"search-list\",null,[[\"pipelines\",\"collections\",\"addToCollection\"],[[25,[\"pipelineList\"]],[25,[\"collections\"]],[25,[\"addToCollection\"]]]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)((0, _testHelpers.findAll)('.dropdown-toggle')[0]);
      await (0, _testHelpers.click)('td.add .dropdown-menu span');
    });
    (0, _qunit.test)('it fails to add a pipeline to a collection', async function (assert) {
      assert.expect(1);
      (0, _injectSession.default)(this);
      (0, _injectScm.default)(this);
      const pipelines = [Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      const collections = [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [2, 3]
      })];

      const addToCollectionMock = () => {
        assert.ok(true);
        return Ember.RSVP.reject();
      };

      this.set('pipelineList', pipelines);
      this.set('collections', collections);
      this.set('addToCollection', addToCollectionMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "QsaLxzHR",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"search-list\",null,[[\"pipelines\",\"collections\",\"addToCollection\"],[[25,[\"pipelineList\"]],[25,[\"collections\"]],[25,[\"addToCollection\"]]]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)((0, _testHelpers.findAll)('.dropdown-toggle')[0]);
      await (0, _testHelpers.click)('td.add .dropdown-menu span');
    });
  });
});
define("screwdriver-ui/tests/integration/components/collection-modal/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _testHelpers, _injectSession) {
  "use strict";

  const mockCollection = {
    id: 1,
    name: 'Test',
    description: 'Test description',
    get: name => name
  };
  const collectionModel = {
    save() {
      return new Ember.RSVP.Promise(resolve => resolve(mockCollection));
    },

    destroyRecord() {}

  };
  (0, _qunit.module)('Integration | Component | collections modal', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.owner.unregister('service:store');
    });
    (0, _qunit.test)('it renders', async function (assert) {
      assert.expect(5);
      this.set('showModal', true);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VsVFrneV",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-modal\",null,[[\"showModal\"],[[25,[\"showModal\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-title').hasText('Create New Collection');
      assert.dom('.name .control-label').hasText('Collection Name');
      assert.dom('.description .control-label').hasText('Description');
      assert.dom('.collection-form__cancel').hasText('Cancel');
      assert.dom('.collection-form__create').hasText('Save');
    });
    (0, _qunit.test)('it cancels creation of a collection', async function (assert) {
      assert.expect(2);
      this.set('showModal', true);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VsVFrneV",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-modal\",null,[[\"showModal\"],[[25,[\"showModal\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-dialog').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.collection-form__cancel');
      assert.dom('.modal-dialog').doesNotExist();
    });
    (0, _qunit.test)('it creates a collection', async function (assert) {
      assert.expect(4);
      (0, _injectSession.default)(this);
      const storeStub = Ember.Service.extend({
        createRecord(model, data) {
          assert.strictEqual(model, 'collection');
          assert.deepEqual(data, {
            name: 'Test',
            description: 'Test description'
          });
          return collectionModel;
        },

        findAll() {
          return new Ember.RSVP.Promise(resolve => resolve([mockCollection]));
        }

      });

      const stubAddFunction = function () {
        assert.ok(true);
      };

      this.set('showModal', true);
      this.set('name', 'Test');
      this.set('description', 'Test description');
      this.set('addToCollection', stubAddFunction);
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ruAo2TVZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-modal\",null,[[\"showModal\",\"name\",\"description\"],[[25,[\"showModal\"]],[25,[\"name\"]],[25,[\"description\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-dialog').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.collection-form__create');
      assert.notOk(this.get('showModal'));
    });
    (0, _qunit.test)('it cancels creation of a collection', async function (assert) {
      assert.expect(3);
      (0, _injectSession.default)(this);
      const model = {
        save() {
          return new Ember.RSVP.Promise((resolve, reject) => reject({
            errors: [{
              detail: 'This is an error message'
            }]
          }));
        },

        destroyRecord() {}

      };
      const storeStub = Ember.Service.extend({
        createRecord() {
          return model;
        }

      });
      this.set('collections', []);
      this.set('showModal', true);
      this.set('errorMessage', null);
      this.set('name', null);
      this.set('description', null);
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "zq1V1Flb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-modal\",null,[[\"collections\",\"showModal\",\"name\",\"description\",\"errorMessage\"],[[25,[\"collections\"]],[25,[\"showModal\"]],[25,[\"name\"]],[25,[\"description\"]],[25,[\"errorMessage\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      this.set('name', 'Test');
      this.set('description', 'Test description');
      assert.ok(this.get('showModal'));
      await (0, _testHelpers.click)('.collection-form__create'); // Modal should remain open because of error

      assert.ok(this.get('showModal'));
      assert.dom('.alert-warning > span').hasText('This is an error message');
    });
  });
});
define("screwdriver-ui/tests/integration/components/collection-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session", "screwdriver-ui/tests/helpers/inject-scm"], function (_qunit, _emberQunit, _testHelpers, _injectSession, _injectScm) {
  "use strict";

  let testCollection;
  (0, _qunit.module)('Integration | Component | collection view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      testCollection = Ember.Object.create({
        id: 1,
        name: 'Test',
        description: 'Test Collection',
        pipelines: [{
          id: 1,
          scmUri: 'github.com:12345678:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/screwdriver',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          lastEventId: 12,
          lastBuilds: [{
            id: 123,
            status: 'SUCCESS',
            // Most recent build
            createTime: '2017-09-05T04:02:20.890Z'
          }]
        }, {
          id: 2,
          scmUri: 'github.com:87654321:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main', 'publish'],
          scmRepo: {
            name: 'screwdriver-cd/ui',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/ui/tree/master'
          },
          scmContext: 'github:github.com',
          annotations: {},
          prs: {
            open: 2,
            failing: 1
          }
        }, {
          id: 3,
          scmUri: 'github.com:54321876:master',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/models',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/models/tree/master'
          },
          scmContext: 'bitbucket:bitbucket.org',
          annotations: {},
          lastEventId: 23,
          lastBuilds: [{
            id: 125,
            status: 'FAILURE',
            // 2nd most recent build
            createTime: '2017-09-05T04:01:41.789Z'
          }]
        }, {
          id: 4,
          scmUri: 'github.com:54321879:master:lib',
          createTime: '2017-01-05T00:55:46.775Z',
          admins: {
            username: true
          },
          workflow: ['main'],
          scmRepo: {
            name: 'screwdriver-cd/zzz',
            branch: 'master',
            url: 'https://github.com/screwdriver-cd/zzz/tree/master',
            rootDir: 'lib'
          },
          scmContext: 'bitbucket:bitbucket.org',
          annotations: {},
          lastEventId: 23,
          lastBuilds: [{
            id: 125,
            status: 'UNSTABLE',
            createTime: '2017-09-05T04:01:41.789Z'
          }]
        }]
      });
    });
    (0, _qunit.test)('it renders', async function (assert) {
      (0, _injectScm.default)(this);
      this.set('mockCollection', testCollection);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UJaNfKaj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-view\",null,[[\"collection\"],[[25,[\"mockCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.header__name').hasText('Test');
      assert.dom('.header__description').hasText('Test Collection');
      assert.dom('table').exists({
        count: 1
      });
      assert.dom('th.app-id').hasText('Name');
      assert.dom('th.branch').hasText('Branch');
      assert.dom('th.account').hasText('Account');
      assert.dom('th.health').hasText('Last Build');
      assert.dom('th.prs').hasText('Pull Requests');
      assert.dom('tr').exists({
        count: 6
      });
      assert.dom('.fa-pencil').exists({
        count: 2
      }); // The pipelines are sorted in alphabetical order by default by the component

      const appIdEls = (0, _testHelpers.findAll)('td.app-id');
      assert.dom(appIdEls[0]).hasText('screwdriver-cd/models');
      assert.dom(appIdEls[1]).hasText('screwdriver-cd/screwdriver');
      assert.dom(appIdEls[2]).hasText('screwdriver-cd/ui');
      assert.dom(appIdEls[3]).hasText('screwdriver-cd/zzz'); // The pipelines are sorted in alphabetical order by default by the component

      const branchEls = (0, _testHelpers.findAll)('td.branch');
      assert.dom(branchEls[0]).hasText('master');
      assert.dom(branchEls[1]).hasText('master');
      assert.dom(branchEls[2]).hasText('master');
      assert.dom(branchEls[3]).hasText('master#lib'); // The models pipeline has scm display names

      const accountEls = (0, _testHelpers.findAll)('td.account');
      assert.dom(accountEls[0]).hasText('bitbucket.org');
      assert.dom(accountEls[1]).hasText('github.com');
      assert.dom(accountEls[2]).hasText('github.com');
      assert.dom(accountEls[3]).hasText('bitbucket.org'); // The pipeline health

      const healthEls = (0, _testHelpers.findAll)('td.health i');
      assert.dom(healthEls[0]).hasClass('build-failure');
      assert.dom(healthEls[1]).hasClass('build-success');
      assert.dom(healthEls[3]).hasClass('build-unstable');
      const openEls = (0, _testHelpers.findAll)('td.prs--open');
      const failingEls = (0, _testHelpers.findAll)('td.prs--failing'); // The models pipeline should not have any info for prs open and failing

      assert.dom(openEls[0]).hasText('');
      assert.dom(failingEls[0]).hasText(''); // The screwdriver pipeline should not have any info for prs open and failing

      assert.dom(openEls[1]).hasText('');
      assert.dom(failingEls[1]).hasText(''); // The ui pipeline should have 2 prs open and 1 failing

      assert.dom(openEls[2]).hasText('2');
      assert.dom(failingEls[2]).hasText('1');
    });
    (0, _qunit.test)('it removes a pipeline from a collection', async function (assert) {
      assert.expect(2);
      (0, _injectSession.default)(this);

      const pipelineRemoveMock = (pipelineId, collectionId) => {
        // Make sure the models pipeline is the one being removed
        assert.strictEqual(pipelineId, 3);
        assert.strictEqual(collectionId, 1);
        return Ember.RSVP.resolve({
          id: 1,
          name: 'collection1',
          description: 'description1',
          pipelineIds: [1],
          pipelines: [{
            id: 1,
            scmUri: 'github.com:12345678:master',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main', 'publish'],
            scmRepo: {
              name: 'screwdriver-cd/screwdriver',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
            },
            scmContext: 'github:github.com',
            annotations: {}
          }]
        });
      };

      this.set('mockCollection', testCollection);
      this.set('onPipelineRemoveMock', pipelineRemoveMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JMVBDm33",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"collection-view\",null,[[\"collection\",\"onPipelineRemove\"],[[25,[\"mockCollection\"]],[25,[\"onPipelineRemoveMock\"]]]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      })); // Delete the models pipeline

      await (0, _testHelpers.click)('.collection-pipeline__remove');
    });
    (0, _qunit.test)('it fails to remove a pipeline', async function (assert) {
      assert.expect(1);
      (0, _injectSession.default)(this);

      const pipelineRemoveMock = () => Ember.RSVP.reject({
        errors: [{
          detail: 'User does not have permission'
        }]
      });

      this.set('mockCollection', testCollection);
      this.set('onPipelineRemoveMock', pipelineRemoveMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JMVBDm33",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n      \"],[1,[29,\"collection-view\",null,[[\"collection\",\"onPipelineRemove\"],[[25,[\"mockCollection\"]],[25,[\"onPipelineRemoveMock\"]]]]],false],[0,\"\\n    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('.collection-pipeline__remove');
      assert.dom('.alert-warning > span').hasText('User does not have permission');
    });
    (0, _qunit.test)('it does not show remove button if user is not logged in', async function (assert) {
      assert.expect(1);
      this.set('mockCollection', testCollection);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UJaNfKaj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-view\",null,[[\"collection\"],[[25,[\"mockCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.collection-pipeline__remove').doesNotExist();
    });
    (0, _qunit.test)('it sorts by last build', async function (assert) {
      this.set('mockCollection', testCollection);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UJaNfKaj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-view\",null,[[\"collection\"],[[25,[\"mockCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      let appIdEls = (0, _testHelpers.findAll)('td.app-id'); // Initially it is sorted by name

      assert.dom(appIdEls[0]).hasText('screwdriver-cd/models');
      assert.dom(appIdEls[1]).hasText('screwdriver-cd/screwdriver');
      await (0, _testHelpers.click)('.header__sort-pipelines .dropdown-toggle');
      await (0, _testHelpers.click)((0, _testHelpers.findAll)('.header__sort-pipelines ul li a')[1]);
      appIdEls = (0, _testHelpers.findAll)('td.app-id'); // Now it should be sorted by most recent last build

      assert.dom(appIdEls[0]).hasText('screwdriver-cd/screwdriver');
      assert.dom(appIdEls[1]).hasText('screwdriver-cd/models');
    });
    (0, _qunit.test)('description is editable', async function (assert) {
      this.set('mockCollection', testCollection);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "UJaNfKaj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collection-view\",null,[[\"collection\"],[[25,[\"mockCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const editEls = (0, _testHelpers.findAll)('.fa-pencil');
      await (0, _testHelpers.click)(editEls[1]);
      await (0, _testHelpers.click)(editEls[0]);
      assert.dom('textarea').exists({
        count: 1
      });
      assert.dom('input').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/collections-flyout/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "sinon", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _testHelpers, _sinon, _injectSession) {
  "use strict";

  const mockCollection = {
    id: 1,
    name: 'Test',
    description: 'Test description',
    get: name => name
  };
  (0, _qunit.module)('Integration | Component | collections flyout', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      assert.expect(6);
      (0, _injectSession.default)(this);
      this.set('collections', [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }), Ember.Object.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }), Ember.Object.create({
        id: 3,
        name: 'collection3',
        description: 'description3',
        pipelineIds: [7, 8, 9]
      })]);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "fSTMfz5E",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\"],[[25,[\"collections\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.header__text').hasText('Collections');
      assert.dom('.header__text a i').hasClass('fa-plus-circle');
      assert.dom('.collection-wrapper a').hasText('collection1');
      const wrapperEls = (0, _testHelpers.findAll)('.collection-wrapper a');
      assert.dom(wrapperEls[0]).hasText('collection1');
      assert.dom(wrapperEls[1]).hasText('collection2');
      assert.dom(wrapperEls[2]).hasText('collection3');
    });
    (0, _qunit.test)('it renders with no collections', async function (assert) {
      assert.expect(2);
      this.set('collections', []);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "fSTMfz5E",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\"],[[25,[\"collections\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.no-collections-text').exists({
        count: 1
      });
      assert.dom('.no-collections-text').hasText('No collections to display.');
    });
    (0, _qunit.test)('it opens collection create modal', async function (assert) {
      assert.expect(9);
      (0, _injectSession.default)(this);
      this.set('collections', []);
      this.set('showModal', false);
      this.set('setModal', () => {
        this.set('showModal', true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "i//PGG0s",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\",\"showModal\",\"setModal\"],[[25,[\"collections\"]],[25,[\"showModal\"]],[25,[\"setModal\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.equal(this.get('showModal'), false); // Make sure there are no modals

      assert.dom('.modal').doesNotExist();
      await (0, _testHelpers.click)('.new');
      assert.equal(this.get('showModal'), true); // Make sure there is only 1 modal

      assert.dom('.modal').exists({
        count: 1
      });
      assert.dom('.modal-title').hasText('Create New Collection');
      assert.dom('.name input').exists({
        count: 1
      });
      assert.dom('.description textarea').exists({
        count: 1
      });
      assert.dom('.collection-form__cancel').hasText('Cancel');
      assert.dom('.collection-form__create').hasText('Save');
    });
    (0, _qunit.test)('it renders an active collection', async function (assert) {
      assert.expect(4);
      this.set('collections', [Ember.Object.create(mockCollection)]);
      this.set('selectedCollectionId', 1);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JZXK/ZiQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\",\"selectedCollectionId\"],[[25,[\"collections\"]],[25,[\"selectedCollectionId\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.header__text').hasText('Collections');
      assert.dom('.header__text a i').doesNotExist();
      assert.dom('.collection-wrapper a').hasText('Test');
      assert.dom('.collection-wrapper.row--active').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it fails to create a collection', async function (assert) {
      assert.expect(3);
      (0, _injectSession.default)(this);
      const model = {
        save() {
          return new Ember.RSVP.Promise((resolve, reject) => reject({
            errors: [{
              detail: 'This is an error message'
            }]
          }));
        },

        destroyRecord() {}

      };
      const storeStub = Ember.Service.extend({
        createRecord() {
          return model;
        }

      });
      this.set('collections', []);
      this.set('showModal', false);
      this.set('errorMessage', null);
      this.set('name', null);
      this.set('description', null);
      this.owner.unregister('service:store');
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "HWcd/kVf",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\",\"showModal\",\"name\",\"description\"],[[25,[\"collections\"]],[25,[\"showModal\"]],[25,[\"name\"]],[25,[\"description\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('.new');
      this.set('name', 'Test');
      this.set('description', 'Test description');
      assert.ok(this.get('showModal'));
      await (0, _testHelpers.click)('.collection-form__create'); // Modal should remain open because of error

      assert.ok(this.get('showModal'));
      assert.dom('.alert-warning > span').hasText('This is an error message');
    });
    (0, _qunit.test)('it deletes a collection', async function (assert) {
      assert.expect(9);
      (0, _injectSession.default)(this);
      const collectionModelMock = {
        destroyRecord() {
          // Dummy assert to make sure this function gets called
          assert.ok(true);
          return new Ember.RSVP.Promise(resolve => resolve());
        }

      };
      const storeStub = Ember.Service.extend({
        peekRecord() {
          assert.ok(true, 'peekRecord called');
          return collectionModelMock;
        },

        findAll() {
          return new Ember.RSVP.Promise(resolve => resolve([mockCollection]));
        }

      });
      this.set('collections', [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }), Ember.Object.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      }), Ember.Object.create({
        id: 3,
        name: 'collection3',
        description: 'description3',
        pipelineIds: [7, 8, 9]
      })]);

      let onDeleteSpy = _sinon.default.spy();

      this.set('showModal', false);
      this.set('name', null);
      this.set('description', null);
      this.set('onDeleteCollection', onDeleteSpy);
      this.owner.unregister('service:store');
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "n31ERvNM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"collections-flyout\",null,[[\"collections\",\"showModal\",\"name\",\"description\",\"onDeleteCollection\"],[[25,[\"collections\"]],[25,[\"showModal\"]],[25,[\"name\"]],[25,[\"description\"]],[25,[\"onDeleteCollection\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.header__edit').exists({
        count: 1
      }); // Make sure delete buttons aren't shown

      assert.dom('.wrapper__delete').doesNotExist();
      await (0, _testHelpers.click)('.header__edit'); // Delete buttons should be visible

      assert.dom('.collection-wrapper__delete').exists({
        count: 3
      });
      assert.dom('.modal').doesNotExist();
      await (0, _testHelpers.click)('.collection-wrapper__delete');
      assert.dom('.modal').exists({
        count: 1
      });
      assert.dom('.modal-title').hasText('Please confirm');
      await (0, _testHelpers.click)('.modal-footer > .btn-primary');
      assert.ok(onDeleteSpy.called);
    });
  });
});
define("screwdriver-ui/tests/integration/components/command-format/componenet-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const DOCKER_COMMAND = {
    id: 2,
    namespace: 'foo',
    name: 'bar',
    version: '1.0.0',
    description: 'A test example',
    maintainer: 'test@example.com',
    format: 'docker',
    docker: {
      image: 'test',
      command: 'example'
    },
    pipelineId: 100
  };
  const HABITAT_COMMAND = {
    id: 3,
    namespace: 'banana',
    name: 'strawberry',
    version: '1.0.0',
    description: 'A fruity example',
    maintainer: 'fruity@example.com',
    format: 'habitat',
    habitat: {
      mode: 'remote',
      package: 'fruit',
      command: 'bananaberry'
    },
    pipelineId: 201
  };
  const BINARY_COMMAND = {
    id: 4,
    namespace: 'dog',
    name: 'cat',
    version: '1.0.0',
    description: 'An animal example',
    maintainer: 'animal@example.com',
    format: 'binary',
    binary: {
      file: './animals.sh'
    },
    pipelineId: 303
  };
  (0, _qunit.module)('Integration | Component | command format', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders docker', async function (assert) {
      this.set('mock', DOCKER_COMMAND);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "voJRNpDM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-format\",null,[[\"command\"],[[25,[\"mock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Format: docker');
      assert.dom('.image .label').hasText('Image:');
      assert.dom('.image .value').hasText('test');
      assert.dom('.docker-command .label').hasText('Command:');
      assert.dom('.docker-command .value').hasText('example');
    });
    (0, _qunit.test)('it renders habitat', async function (assert) {
      this.set('mock', HABITAT_COMMAND);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "voJRNpDM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-format\",null,[[\"command\"],[[25,[\"mock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Format: habitat');
      assert.dom('.mode .label').hasText('Mode:');
      assert.dom('.mode .value').hasText('remote');
      assert.dom('.package .label').hasText('Package:');
      assert.dom('.package .value').hasText('fruit');
      assert.dom('.habitat-command .label').hasText('Command:');
      assert.dom('.habitat-command .value').hasText('bananaberry');
    });
    (0, _qunit.test)('it renders binary', async function (assert) {
      this.set('mock', BINARY_COMMAND);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "voJRNpDM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-format\",null,[[\"command\"],[[25,[\"mock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Format: binary');
      assert.dom('.file .label').hasText('File:');
      assert.dom('.file .value').hasText('./animals.sh');
    });
  });
});
define("screwdriver-ui/tests/integration/components/command-header/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const COMMAND = {
    id: 2,
    namespace: 'foo',
    name: 'bar',
    version: '1.0.0',
    description: 'A test example',
    maintainer: 'test@example.com',
    format: 'docker',
    docker: '{"image":"test","command":"example"}',
    pipelineId: 100
  };
  const mockPipeline = {
    id: 1,
    scmRepo: {
      url: 'github.com/screwdriver-cd'
    },

    get(key) {
      return this[key];
    }

  };
  (0, _qunit.module)('Integration | Component | command header', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const storeStub = Ember.Service.extend({
        findRecord() {
          return new Ember.RSVP.Promise(resolve => resolve(mockPipeline));
        }

      });
      this.owner.register('service:store', storeStub);
      this.set('mock', COMMAND);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "sdn+u2L/",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-header\",null,[[\"command\"],[[25,[\"mock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('foo/bar');
      assert.dom('h2').hasText('1.0.0');
      assert.dom('p').hasText('A test example');
      assert.dom('ul li:first-child').hasText('Released by: test@example.com');
      assert.dom('ul li:first-child a').hasAttribute('href', 'mailto:test@example.com');
      assert.dom('h4').hasText('Usage:');
      assert.dom('pre').hasText('sd-cmd exec foo/bar@1.0.0');
    });
  });
});
define("screwdriver-ui/tests/integration/components/command-versions/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const COMMANDS = [{
    version: '3.0.0',
    tag: 'latest stable'
  }, {
    version: '2.0.0',
    tag: 'meeseeks'
  }, {
    version: '1.0.0'
  }];
  (0, _qunit.module)('Integration | Component | command versions', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.actions = {};

      this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
    });
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('mock', COMMANDS);

      this.actions.mockAction = function () {};

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Nuv0XO6S",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-versions\",null,[[\"commands\",\"changeVersion\"],[[25,[\"mock\"]],[29,\"action\",[[24,0,[]],\"mockAction\"],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Versions:');
      assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
      assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
      assert.dom('ul li:last-child').hasText('1.0.0');
    });
    (0, _qunit.test)('it handles clicks on versions', async function (assert) {
      assert.expect(5);
      this.set('mock', COMMANDS);

      this.actions.mockAction = function (ver) {
        assert.equal(ver, '1.0.0');
      };

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Nuv0XO6S",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"command-versions\",null,[[\"commands\",\"changeVersion\"],[[25,[\"mock\"]],[29,\"action\",[[24,0,[]],\"mockAction\"],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Versions:');
      assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
      assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
      assert.dom('ul li:last-child').hasText('1.0.0');
      await (0, _testHelpers.click)('ul li:last-child span');
    });
  });
});
define("screwdriver-ui/tests/integration/components/error-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | error view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('sc', 400);
      this.set('sm', 'they are dead, dave');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "/ZpLIk/X",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"error-view\",null,[[\"errorMessage\",\"statusCode\",\"statusMessage\"],[\"bananas\",[25,[\"sc\"]],[25,[\"sm\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('400');
      assert.dom('h2').hasText('they are dead, dave');
      assert.dom('h4').hasText('bananas');
    });
  });
});
define("screwdriver-ui/tests/integration/components/home-hero/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | home hero', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cXryNBs3",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"home-hero\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('Introducing Screwdriver');
      assert.dom('h2').hasText('Getting started, by the numbers...');
    });
  });
});
define("screwdriver-ui/tests/integration/components/info-message/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | info message', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "FJOIuNWG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"info-message\",null,[[\"message\"],[\"batman\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.alert > span').hasText('batman');
    });
  });
});
define("screwdriver-ui/tests/integration/components/job-toggle-modal/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _testHelpers, _injectSession) {
  "use strict";

  (0, _qunit.module)('Integration | Component | job toggle modal', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      assert.expect(4);
      this.set('showToggleModal', true);
      this.set('name', 'main');
      this.set('stateChange', 'Disable');
      this.set('updateMessageMock', message => {
        assert.equal(message, 'testing');
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "QDuRJyfp",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"job-toggle-modal\",null,[[\"showToggleModal\",\"updateMessage\",\"name\",\"stateChange\"],[[25,[\"showToggleModal\"]],[25,[\"updateMessageMock\"]],[25,[\"name\"]],[25,[\"stateChange\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-title').hasText('Disable the "main" job?');
      assert.dom('.message .control-label').hasText('Reason');
      assert.dom('.toggle-form__cancel').hasText('Cancel');
      assert.dom('.toggle-form__create').hasText('Confirm');
    });
    (0, _qunit.test)('it cancels job state update', async function (assert) {
      assert.expect(2);
      this.set('showToggleModal', true);
      this.set('name', 'main');
      this.set('stateChange', 'Disable');
      this.set('updateMessageMock', message => {
        assert.equal(message, 'testing');
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "QDuRJyfp",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"job-toggle-modal\",null,[[\"showToggleModal\",\"updateMessage\",\"name\",\"stateChange\"],[[25,[\"showToggleModal\"]],[25,[\"updateMessageMock\"]],[25,[\"name\"]],[25,[\"stateChange\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-dialog').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.toggle-form__cancel');
      assert.dom('.modal-dialog').doesNotExist();
    });
    (0, _qunit.test)('it updates a job state', async function (assert) {
      (0, _injectSession.default)(this);
      assert.expect(3);

      const stubUpdateFunction = function (message) {
        assert.equal(message, 'testing');
      };

      this.set('showToggleModal', true);
      this.set('message', 'testing');
      this.set('updateMessageMock', stubUpdateFunction);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3K1qYxPm",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"job-toggle-modal\",null,[[\"showToggleModal\",\"updateMessage\",\"name\",\"message\",\"stateChange\"],[[25,[\"showToggleModal\"]],[25,[\"updateMessageMock\"]],[25,[\"name\"]],[25,[\"message\"]],[25,[\"stateChange\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.modal-dialog').exists({
        count: 1
      });
      await (0, _testHelpers.click)('.toggle-form__create');
      assert.notOk(this.get('showToggleModal'));
    });
  });
});
define("screwdriver-ui/tests/integration/components/loading-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | loading view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "hXKAW7bf",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"loading-view\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h2').hasText('Loading...');
      assert.ok((0, _testHelpers.find)('p').textContent.trim());
    });
  });
});
define("screwdriver-ui/tests/integration/components/login-button/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-scm"], function (_qunit, _emberQunit, _testHelpers, _injectScm) {
  "use strict";

  (0, _qunit.module)('Integration | Component | login button', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      assert.expect(2);
      this.set('externalAction', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "22kFMylU",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"login-button\",null,[[\"authenticate\"],[[29,\"action\",[[24,0,[]],[25,[\"externalAction\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h2').hasText('Sign in to Screwdriver');
      await (0, _testHelpers.click)('a');
    });
    (0, _qunit.test)('it renders multiple buttons', async function (assert) {
      assert.expect(5);
      (0, _injectScm.default)(this);
      const contexts = this.owner.lookup('service:scm').getScms();
      this.set('externalAction', context => {
        assert.ok(context);
      });
      this.set('model', contexts);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "9nk61Lk4",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"login-button\",null,[[\"authenticate\",\"scmContexts\"],[[29,\"action\",[[24,0,[]],[25,[\"externalAction\"]]],null],[25,[\"model\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('a').exists({
        count: 2
      });
      const a = (0, _testHelpers.findAll)('a');
      contexts.forEach(async (context, i) => {
        assert.dom(a[i]).hasText("Sign in with ".concat(context.displayName));
        await (0, _testHelpers.click)(a[i]);
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/nav-banner/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | nav banner', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders banners', async function (assert) {
      const bannerStub = Ember.Service.extend({
        fetchBanners: () => Ember.RSVP.resolve([Ember.Object.create({
          id: 1,
          isActive: true,
          message: 'shutdown imminent'
        })])
      });
      this.owner.register('service:banner', bannerStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YvvFwLi5",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"nav-banner\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.banner').hasText('× shutdown imminent');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-create-form/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline create form', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "U5UT0X9v",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-create-form\",null,[[\"errorMessage\",\"isSaving\"],[\"\",false]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('Create Pipeline');
      assert.dom('.button-label').hasText('Create Pipeline');
    });
    (0, _qunit.test)('it handles the entire ui flow', async function (assert) {
      assert.expect(3);
      const scm = 'git@github.com:foo/bar.git';
      const root = 'lib';
      this.set('createPipeline', ({
        scmUrl,
        rootDir
      }) => {
        assert.equal(scmUrl, scm);
        assert.equal(rootDir, root);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "4sVCkIsZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-create-form\",null,[[\"errorMessage\",\"isSaving\",\"onCreatePipeline\"],[\"\",false,[29,\"action\",[[24,0,[]],[25,[\"createPipeline\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.scm-url', scm);
      await (0, _testHelpers.click)('.checkbox-input');
      await (0, _testHelpers.fillIn)('.root-dir', root);
      await (0, _testHelpers.triggerKeyEvent)('.scm-url', 'keyup', 'SPACE');
      await (0, _testHelpers.triggerKeyEvent)('.root-dir', 'keyup', 'SPACE');
      assert.dom('i.fa').hasClass('fa-check');
      await (0, _testHelpers.click)('button.blue-button');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-event-row/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const event = {
    id: 3,
    startFrom: '~commit',
    status: 'SUCCESS',
    type: 'pipeline',
    causeMessage: 'test',
    commit: {
      url: '#',
      message: 'this was a test'
    },
    creator: {
      url: '#',
      name: 'batman'
    },
    createTimeWords: 'now',
    durationText: '1 sec',
    truncatedMessage: 'this was a test',
    truncatedSha: 'abc123',
    workflowGraph: {
      nodes: [{
        name: '~pr'
      }, {
        name: '~commit'
      }, {
        id: 1,
        name: 'main'
      }, {
        id: 2,
        name: 'A'
      }, {
        id: 3,
        name: 'B'
      }],
      edges: [{
        src: '~pr',
        dest: 'main'
      }, {
        src: '~commit',
        dest: 'main'
      }, {
        src: 'main',
        dest: 'A'
      }, {
        src: 'A',
        dest: 'B'
      }]
    },
    builds: [{
      jobId: 1,
      id: 4,
      status: 'SUCCESS'
    }, {
      jobId: 2,
      id: 5,
      status: 'SUCCESS'
    }, {
      jobId: 3,
      id: 6,
      status: 'FAILURE'
    }]
  };
  (0, _qunit.module)('Integration | Component | pipeline event row', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.actions = {};

      this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
    });
    (0, _qunit.test)('it renders with pipeline event', async function (assert) {
      this.actions.eventClick = () => {
        assert.ok(true);
      };

      const eventMock = Ember.Object.create(Ember.copy(event, true));
      this.set('event', eventMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "TjazfB+B",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-event-row\",null,[[\"event\",\"selectedEvent\",\"lastSuccessful\"],[[25,[\"event\"]],3,3]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.SUCCESS').exists({
        count: 1
      });
      assert.dom('.status .fa-check-circle-o').exists({
        count: 1
      });
      assert.dom('.commit').hasText('#abc123');
      assert.dom('.message').hasText('this was a test');
      assert.dom('svg').exists({
        count: 1
      });
      assert.dom('.graph-node').exists({
        count: 4
      });
      assert.dom('.graph-edge').exists({
        count: 3
      });
      assert.dom('.by').hasText('batman');
      assert.dom('.date').hasText('Started now');
    });
    (0, _qunit.test)('it renders with pr event', async function (assert) {
      this.actions.eventClick = () => {
        assert.ok(true);
      };

      const eventMock = Ember.Object.create(Ember.assign(Ember.copy(event, true), {
        startFrom: '~pr',
        type: 'pr',
        pr: {
          url: 'https://foo/bar/baz/pull/2'
        },
        prNum: 2
      }));
      this.set('event', eventMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "TjazfB+B",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-event-row\",null,[[\"event\",\"selectedEvent\",\"lastSuccessful\"],[[25,[\"event\"]],3,3]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.SUCCESS').exists({
        count: 1
      });
      assert.dom('.status .fa-check-circle-o').exists({
        count: 1
      });
      assert.dom('.commit').hasText('PR-2');
      assert.dom('.message').hasText('this was a test');
      assert.dom('svg').exists({
        count: 1
      });
      assert.dom('.graph-node').exists({
        count: 4
      });
      assert.dom('.graph-edge').exists({
        count: 3
      });
      assert.dom('.by').hasText('batman');
      assert.dom('.date').hasText('Started now');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-events-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline events list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const events = [Ember.Object.create({
        id: 4,
        startFrom: '~commit',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedMessage: 'this was a test',
        truncatedSha: 'abc124',
        workflowGraph: {
          nodes: [{
            name: '~pr'
          }, {
            name: '~commit'
          }, {
            id: 1,
            name: 'main'
          }, {
            id: 2,
            name: 'A'
          }, {
            id: 3,
            name: 'B'
          }],
          edges: [{
            src: '~pr',
            dest: 'main'
          }, {
            src: '~commit',
            dest: 'main'
          }, {
            src: 'main',
            dest: 'A'
          }, {
            src: 'A',
            dest: 'B'
          }]
        },
        builds: [{
          jobId: 1,
          id: 4,
          status: 'SUCCESS'
        }, {
          jobId: 2,
          id: 5,
          status: 'SUCCESS'
        }, {
          jobId: 3,
          id: 6,
          status: 'FAILURE'
        }]
      }), Ember.Object.create({
        id: 3,
        startFrom: '~commit',
        causeMessage: 'test',
        commit: {
          url: '#',
          message: 'this was a test'
        },
        creator: {
          url: '#',
          name: 'batman'
        },
        createTimeWords: 'now',
        durationText: '1 sec',
        truncatedSha: 'abc123',
        workflowGraph: {
          nodes: [{
            name: '~pr'
          }, {
            name: '~commit'
          }, {
            id: 1,
            name: 'main'
          }, {
            id: 2,
            name: 'A'
          }, {
            id: 3,
            name: 'B'
          }],
          edges: [{
            src: '~pr',
            dest: 'main'
          }, {
            src: '~commit',
            dest: 'main'
          }, {
            src: 'main',
            dest: 'A'
          }, {
            src: 'A',
            dest: 'B'
          }]
        },
        builds: [{
          jobId: 1,
          id: 4,
          status: 'SUCCESS'
        }, {
          jobId: 2,
          id: 5,
          status: 'SUCCESS'
        }, {
          jobId: 3,
          id: 6,
          status: 'FAILURE'
        }]
      })];
      this.set('eventsMock', events);
      this.set('updateEventsMock', page => {
        assert.equal(page, 2);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Ri/SCsji",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-events-list\",null,[[\"events\",\"eventsPage\",\"updateEvents\"],[[25,[\"eventsMock\"]],1,[25,[\"updateEventsMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.view').exists({
        count: 2
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-graph-nav/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline graph nav', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      Ember.set(this, 'obj', {
        truncatedSha: 'abc123',
        status: 'SUCCESS',
        creator: {
          name: 'anonymous'
        }
      });
      Ember.set(this, 'selected', 2);
      Ember.set(this, 'startBuild', () => {
        assert.ok(true);
      });
      Ember.set(this, 'currentEventType', 'pipeline');
      Ember.set(this, 'showDownstreamTriggers', false);
      Ember.set(this, 'setDownstreamTrigger', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "gIktvqvG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-graph-nav\",null,[[\"mostRecent\",\"lastSuccessful\",\"selectedEvent\",\"selectedEventObj\",\"selected\",\"startMainBuild\",\"startPRBuild\",\"graphType\",\"showDownstreamTriggers\",\"setDownstreamTrigger\"],[3,2,2,[25,[\"obj\"]],[25,[\"selected\"]],[25,[\"startBuild\"]],[25,[\"startBuild\"]],[25,[\"currentEventType\"]],[25,[\"showDownstreamTriggers\"]],[25,[\"setDownstreamTrigger\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.row strong').hasText('Pipeline');
      assert.dom('.row button').exists({
        count: 3
      });
      const $columnTitles = this.$('.event-info .title');
      const $links = this.$('.event-info a');
      assert.equal($columnTitles.eq(0).text().trim(), 'Commit');
      assert.equal($columnTitles.eq(1).text().trim(), 'Message');
      assert.equal($columnTitles.eq(2).text().trim(), 'Status');
      assert.equal($columnTitles.eq(3).text().trim(), 'User');
      assert.equal($columnTitles.eq(4).text().trim(), 'Start Time');
      assert.equal($columnTitles.eq(5).text().trim(), 'Duration');
      assert.equal($links.eq(0).text().trim(), '#abc123');
      assert.equal($links.eq(1).text().trim(), 'anonymous');
      assert.dom('.SUCCESS').exists({
        count: 1
      });
      assert.dom('.btn-group').hasText('Most Recent Last Successful Aggregate');
      assert.dom('.x-toggle-component').includesText('Show triggers');
    });
    (0, _qunit.test)('it updates selected event id', async function (assert) {
      assert.expect(1);
      Ember.set(this, 'obj', {
        truncatedSha: 'abc123'
      });
      Ember.set(this, 'selected', 2);
      Ember.set(this, 'startBuild', () => {
        assert.ok(true);
      });
      Ember.set(this, 'currentEventType', 'pipeline');
      Ember.set(this, 'showDownstreamTriggers', false);
      Ember.set(this, 'setDownstreamTrigger', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "gIktvqvG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-graph-nav\",null,[[\"mostRecent\",\"lastSuccessful\",\"selectedEvent\",\"selectedEventObj\",\"selected\",\"startMainBuild\",\"startPRBuild\",\"graphType\",\"showDownstreamTriggers\",\"setDownstreamTrigger\"],[3,2,2,[25,[\"obj\"]],[25,[\"selected\"]],[25,[\"startBuild\"]],[25,[\"startBuild\"]],[25,[\"currentEventType\"]],[25,[\"showDownstreamTriggers\"]],[25,[\"setDownstreamTrigger\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      this.$('button').filter(':first').click();
      assert.equal(Ember.get(this, 'selected'), 3);
    });
    (0, _qunit.test)('it renders when selectedEvent is a PR event', async function (assert) {
      assert.expect(2);
      Ember.set(this, 'obj', {
        truncatedSha: 'abc123',
        status: 'SUCCESS',
        creator: {
          name: 'anonymous'
        },
        prNum: 1,
        type: 'pr'
      });
      Ember.set(this, 'selected', 2);
      Ember.set(this, 'startBuild', (prNum, jobs) => {
        assert.equal(prNum, 1);
        assert.equal(jobs[0].group, 1);
      });
      Ember.set(this, 'currentEventType', 'pr');
      Ember.set(this, 'pullRequestGroups', {
        1: [{
          name: 'PR-1:foo',
          isPR: true,
          group: 1
        }, {
          name: 'PR-1:bar',
          isPR: true,
          group: 1
        }],
        2: [{
          name: 'PR-2:foo',
          isPR: true,
          group: 2
        }]
      });
      Ember.set(this, 'showDownstreamTriggers', false);
      Ember.set(this, 'setDownstreamTrigger', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "5QNTqRrG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-graph-nav\",null,[[\"mostRecent\",\"lastSuccessful\",\"selectedEvent\",\"selectedEventObj\",\"selected\",\"startMainBuild\",\"startPRBuild\",\"graphType\",\"prGroups\",\"showDownstreamTriggers\",\"setDownstreamTrigger\"],[3,2,2,[25,[\"obj\"]],[25,[\"selected\"]],[25,[\"startBuild\"]],[25,[\"startBuild\"]],[25,[\"currentEventType\"]],[25,[\"pullrequestGroups\"]],[25,[\"showDownstreamTriggers\"]],[25,[\"setDownstreamTrigger\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.row strong').hasText('Pull Requests');
      assert.dom('.row button').exists({
        count: 2
      });
    });
    (0, _qunit.test)('it handles toggling triggers', async function (assert) {
      assert.expect(2);
      Ember.set(this, 'obj', {
        truncatedSha: 'abc123'
      });
      Ember.set(this, 'selected', 2);
      Ember.set(this, 'startBuild', () => {
        assert.ok(true);
      });
      Ember.set(this, 'setTrigger', () => {
        assert.ok(true);
      });
      Ember.set(this, 'currentEventType', 'pipeline');
      Ember.set(this, 'showDownstreamTriggers', false);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "W7MniRlP",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-graph-nav\",null,[[\"mostRecent\",\"lastSuccessful\",\"graphType\",\"selectedEvent\",\"selectedEventObj\",\"selected\",\"startMainBuild\",\"startPRBuild\",\"setDownstreamTrigger\",\"showDownstreamTriggers\"],[3,2,[25,[\"currentEventType\"]],2,[25,[\"obj\"]],[25,[\"selected\"]],[25,[\"startBuild\"]],[25,[\"startBuild\"]],[25,[\"setTrigger\"]],[25,[\"showDownstreamTriggers\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.x-toggle-component').includesText('Show triggers');
      await (0, _testHelpers.click)('.x-toggle-btn');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-header/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline header', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const pipelineMock = Ember.Object.create({
        appId: 'batman/batmobile',
        hubUrl: 'http://example.com/batman/batmobile',
        branch: 'master',
        scmContext: 'github.com'
      });
      const scmMock = Ember.Object.create({
        scm: 'github.com',
        scmIcon: 'github'
      });
      this.set('pipelineMock', pipelineMock);
      this.set('scmMock', scmMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "orOh2wwx",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-header\",null,[[\"pipeline\",\"scmContext\"],[[25,[\"pipelineMock\"]],[25,[\"scmMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('batman/batmobile');
      assert.dom('a.branch').hasText('master');
      assert.dom('a.branch').hasAttribute('href', 'http://example.com/batman/batmobile');
      assert.dom('span.scm', 'github.com');
      assert.dom('.scm > .fa-github').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it renders link to parent pipeline for child pipeline', async function (assert) {
      const pipelineMock = Ember.Object.create({
        appId: 'batman/batmobile',
        hubUrl: 'http://example.com/batman/batmobile',
        branch: 'master',
        scmContext: 'github.com',
        configPipelineId: '123'
      });
      const scmMock = Ember.Object.create({
        scm: 'github.com',
        scmIcon: 'github'
      });
      this.set('pipelineMock', pipelineMock);
      this.set('scmMock', scmMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "orOh2wwx",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-header\",null,[[\"pipeline\",\"scmContext\"],[[25,[\"pipelineMock\"]],[25,[\"scmMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('a:nth-child(5)').hasText('Parent Pipeline');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const pipelines = [Ember.Object.create({
        id: 3,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      }), Ember.Object.create({
        id: 4,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      })];
      const pipeline = Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      });
      this.set('pipelineList', pipelines);
      this.set('pipeline', pipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "/BrBYE0+",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-list\",null,[[\"pipelines\",\"pipeline\"],[[25,[\"pipelineList\"]],[25,[\"pipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom((0, _testHelpers.find)('ul li:first-child')).hasText('foo/bar');
      assert.dom('ul li:nth-child(2)').hasText('batman/tumbler');
      assert.dom('button').hasText('Start All');
      assert.dom('.num-results span').hasText('Found 2 child pipeline(s)');
    });
    (0, _qunit.test)('it renders with zero child piplines found', async function (assert) {
      const pipelines = [];
      const pipeline = Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      });
      this.set('pipelineList', pipelines);
      this.set('pipeline', pipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "/BrBYE0+",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-list\",null,[[\"pipelines\",\"pipeline\"],[[25,[\"pipelineList\"]],[25,[\"pipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.num-results span').hasText('No child pipeline(s) created');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-nav/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | sd pipeline nav', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders without child pipelines tab', async function (assert) {
      const pipeline = Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      });
      this.set('pipelineMock', pipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YJ77S6cM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipelineMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('li:first-child a').hasText('Events');
      assert.dom('li:nth-child(2) a').hasText('Secrets');
      assert.dom('li:nth-child(3) a').hasText('Options');
      assert.dom('li:last-child a').hasText('Metrics');
    });
    (0, _qunit.test)('it renders with child pipelines tab', async function (assert) {
      const pipeline = Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com',
        childPipelines: {
          foo: 'bar'
        }
      });
      this.set('pipelineMock', pipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YJ77S6cM",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-nav\",null,[[\"pipeline\"],[[25,[\"pipelineMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('li:first-child a').hasText('Child Pipelines');
      assert.dom('li:nth-child(2) a').hasText('Events');
      assert.dom('li:nth-child(3) a').hasText('Secrets');
      assert.dom('li:nth-child(4) a').hasText('Options');
      assert.dom('li:last-child a').hasText('Metrics');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-options/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _testHelpers, _injectSession) {
  "use strict";

  /* eslint new-cap: ["error", { "capIsNewExceptions": ["A"] }] */
  let syncService;
  let cacheService;
  (0, _qunit.module)('Integration | Component | pipeline options', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      }));
      this.set('mockJobs', Ember.A([Ember.Object.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }), Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }), Ember.Object.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "p6UKDpKb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"jobs\"],[[25,[\"mockPipeline\"]],[25,[\"mockJobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      })); // Pipeline

      assert.dom('section.pipeline h3').hasText('Pipeline');
      assert.dom('section.pipeline li').exists({
        count: 1
      });
      assert.dom('section.pipeline h4').hasText('Checkout URL and Source Directory');
      assert.dom('section.pipeline p').hasText('Update your checkout URL and / or source directory.');
      assert.dom('section.pipeline .button-label').hasText('Update'); // Jobs

      assert.dom('section.jobs h3').hasText('Jobs');
      assert.dom('section.jobs li').exists({
        count: 4
      });
      assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
      assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
      assert.dom('section.jobs li:nth-child(4) h4').hasText('main');
      assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
      assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked'); // Sync

      assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
      assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
      assert.dom('section.sync li:last-child h4').hasText('Pipeline'); // Cache

      assert.dom('section.cache li:first-child h4').hasText('Pipeline');
      assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
      assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
      assert.dom('section.cache li:last-child h4').hasText('Job main'); // Danger Zone

      assert.dom('section.danger h3').hasText('Danger Zone');
      assert.dom('section.danger li').exists({
        count: 1
      });
      assert.dom('section.danger h4').hasText('Remove this pipeline');
      assert.dom('section.danger p').hasText('Once you remove a pipeline, there is no going back.');
      assert.dom('section.danger a i').hasClass('fa-trash');
    });
    (0, _qunit.test)('it updates a pipeline', async function (assert) {
      const scm = 'git@github.com:foo/bar.git';
      this.set('updatePipeline', ({
        scmUrl
      }) => {
        assert.equal(scmUrl, scm);
      });
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:notMaster',
        id: 'abc1234',
        rootDir: ''
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "j+pOc5aR",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"errorMessage\",\"isSaving\",\"onUpdatePipeline\"],[[25,[\"mockPipeline\"]],\"\",false,[29,\"action\",[[24,0,[]],[25,[\"updatePipeline\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.scm-url').hasValue('git@github.com:foo/bar.git#notMaster');
      assert.dom('.root-dir').doesNotExist();
      await (0, _testHelpers.fillIn)('.scm-url', scm);
      await (0, _testHelpers.triggerKeyEvent)('.text-input', 'keyup', 'SPACE');
      assert.dom('.scm-url').hasValue(scm);
      await (0, _testHelpers.click)('button.blue-button');
    });
    (0, _qunit.test)('it updates a pipeline with rootDir', async function (assert) {
      const scm = 'git@github.com:foo/bar.git';
      const root = 'lib';
      assert.expect(6);
      this.set('updatePipeline', ({
        scmUrl,
        rootDir
      }) => {
        assert.equal(scmUrl, scm);
        assert.equal(rootDir, root);
      });
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:notMaster',
        rootDir: '',
        id: 'abc1234'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "j+pOc5aR",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"errorMessage\",\"isSaving\",\"onUpdatePipeline\"],[[25,[\"mockPipeline\"]],\"\",false,[29,\"action\",[[24,0,[]],[25,[\"updatePipeline\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.scm-url').hasValue('git@github.com:foo/bar.git#notMaster');
      assert.dom('.root-dir').doesNotExist('');
      await (0, _testHelpers.fillIn)('.scm-url', scm);
      await (0, _testHelpers.click)('.checkbox-input');
      await (0, _testHelpers.fillIn)('.root-dir', root);
      await (0, _testHelpers.triggerKeyEvent)('.scm-url', 'keyup', 'SPACE');
      assert.dom('.scm-url').hasValue(scm);
      assert.dom('.root-dir').hasValue(root);
      await (0, _testHelpers.click)('button.blue-button');
    });
    (0, _qunit.test)('it opens job toggle modal', async function (assert) {
      assert.expect(8);
      (0, _injectSession.default)(this);
      const main = Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      });
      const jobModelMock = {
        save() {
          return Ember.RSVP.resolve(main);
        }

      };
      const storeStub = Ember.Service.extend({
        peekRecord() {
          assert.ok(true, 'peekRecord called');
          return jobModelMock;
        }

      });
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      }));
      this.set('showToggleModal', false);
      this.set('mockJobs', Ember.A([main]));
      this.set('username', 'tkyi');
      this.set('setJobStatsMock', (id, state, name, message) => {
        assert.equal(id, '1234');
        assert.equal(message, ' ');
        assert.equal(name, 'tkyi');
        assert.equal(state, 'DISABLED');
        main.set('state', state);
        main.set('stateChanger', 'tkyi');
        main.set('stateChangeMessage', ' ');
        main.set('isDisabled', state === 'DISABLED');
        this.set('state', state);
        this.set('showToggleModal', false);
      });
      this.owner.unregister('service:store');
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "1skYPP7X",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"username\",\"pipeline\",\"setJobStatus\",\"jobs\",\"showToggleModal\"],[[25,[\"username\"]],[25,[\"mockPipeline\"]],[25,[\"setJobStatsMock\"]],[25,[\"mockJobs\"]],[25,[\"showToggleModal\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.equal(this.get('showToggleModal'), false);
      assert.dom('.modal').doesNotExist();
      await (0, _testHelpers.click)('.x-toggle-btn');
      assert.equal(this.get('showToggleModal'), true); // Make sure there is only 1 modal

      assert.dom('.modal').exists({
        count: 1
      });
      assert.dom('.modal-title').hasText('Disable the "main" job?');
      assert.dom('.message input').exists({
        count: 1
      });
      assert.dom('.toggle-form__cancel').hasText('Cancel');
      assert.dom('.toggle-form__create').hasText('Confirm');
    });
    (0, _qunit.test)('it handles job disabling', async function (assert) {
      const main = Ember.Object.create({
        id: '1234',
        name: 'main',
        state: 'ENABLED',
        stateChanger: 'tkyi',
        stateChangeMessage: 'testing',
        isDisabled: false
      });
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      }));
      this.set('mockJobs', Ember.A([main]));
      this.set('username', 'tkyi');
      this.set('setJobStatsMock', (id, state, name) => {
        assert.equal(id, '1234');
        assert.equal(state, 'DISABLED');
        assert.equal(name, 'tkyi');
        main.set('isDisabled', state === 'DISABLED');
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "33hIy3IP",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"username\",\"pipeline\",\"setJobStatus\",\"jobs\"],[[25,[\"username\"]],[25,[\"mockPipeline\"]],[25,[\"setJobStatsMock\"]],[25,[\"mockJobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked');
      await (0, _testHelpers.click)('.x-toggle-btn');
      await (0, _testHelpers.click)('.toggle-form__create');
      assert.dom('section.jobs h4').hasText('main');
      assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
      assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
      assert.dom('section.jobs li:nth-child(2) p').hasText('Disabled by tkyi: testing');
    });
    (0, _qunit.test)('it handles job enabling', async function (assert) {
      const main = Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: true
      });
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      }));
      this.set('mockJobs', Ember.A([main]));
      this.set('setJobStatsMock', (id, state) => {
        assert.equal(id, '1234');
        assert.equal(state, 'ENABLED');
        main.set('isDisabled', state === 'DISABLED');
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cuVz8qZU",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"setJobStatus\",\"jobs\"],[[25,[\"mockPipeline\"]],[25,[\"setJobStatsMock\"]],[25,[\"mockJobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('section.jobs h4').hasText('main');
      assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
      assert.dom('.x-toggle-container').hasNoClass('x-toggle-container-checked');
      await (0, _testHelpers.click)('.x-toggle-btn');
      await (0, _testHelpers.click)('.toggle-form__create');
      assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked'); // return settled().then(() => {
      // });
    });
    (0, _qunit.test)('it handles pipeline remove flow', async function (assert) {
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234'
      }));
      this.set('removePipelineMock', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cZ5l+voy",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"onRemovePipeline\"],[[25,[\"mockPipeline\"]],[25,[\"removePipelineMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('section.danger h4').hasText('Remove this pipeline');
      await (0, _testHelpers.click)('section.danger a');
      assert.dom('section.danger h4').hasText('Are you absolutely sure?');
      assert.dom('section.danger a').exists({
        count: 2
      });
      await (0, _testHelpers.click)('section.danger a');
      assert.dom('section.danger h4').hasText('Remove this pipeline');
      await (0, _testHelpers.click)('section.danger a');
      assert.dom('section.danger h4').hasText('Are you absolutely sure?');
      await (0, _testHelpers.click)('section.danger a:last-child');
      assert.dom('section.danger p').hasText('Please wait...');
    });
    (0, _qunit.test)('it syncs the webhooks', async function (assert) {
      syncService = Ember.Service.extend({
        syncRequests(pipelineId, syncPath) {
          assert.equal(pipelineId, 1);
          assert.equal(syncPath, 'webhooks');
          return Ember.RSVP.resolve({});
        }

      });
      this.owner.register('service:sync', syncService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.sync a');
    });
    (0, _qunit.test)('it syncs the pullrequests', async function (assert) {
      syncService = Ember.Service.extend({
        syncRequests(pipelineId, syncPath) {
          assert.equal(pipelineId, 1);
          assert.equal(syncPath, 'pullrequests');
          return Ember.RSVP.resolve({});
        }

      });
      this.owner.register('service:sync', syncService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.sync li:nth-child(2) a');
    });
    (0, _qunit.test)('it syncs the pipeline', async function (assert) {
      syncService = Ember.Service.extend({
        syncRequests(pipelineId, syncPath) {
          assert.equal(pipelineId, 1);
          assert.equal(syncPath, undefined);
          return Ember.RSVP.resolve({});
        }

      });
      this.owner.register('service:sync', syncService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.sync li:nth-child(3) a');
    });
    (0, _qunit.test)('it fails to sync the pipeline', async function (assert) {
      syncService = Ember.Service.extend({
        syncRequests() {
          return Ember.RSVP.reject('something conflicting');
        }

      });
      this.owner.register('service:sync', syncService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.sync li:nth-child(3) a');
      assert.dom('.alert > span').hasText('something conflicting');
    });
    (0, _qunit.test)('it does not render pipeline and danger for child pipeline', async function (assert) {
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: 'abc1234',
        configPipelineId: '123'
      }));
      this.set('mockJobs', Ember.A([Ember.Object.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }), Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }), Ember.Object.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "p6UKDpKb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"jobs\"],[[25,[\"mockPipeline\"]],[25,[\"mockJobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      })); // Pipeline should not render

      assert.dom('section.pipeline h3').doesNotExist(); // Jobs should render

      assert.dom('section.jobs h3').hasText('Jobs');
      assert.dom('section.jobs li').exists({
        count: 4
      });
      assert.dom('section.jobs li:nth-child(2) h4').hasText('A');
      assert.dom('section.jobs li:nth-child(3) h4').hasText('B');
      assert.dom('section.jobs li:nth-child(4) h4').hasText('main'); // eslint-disable-next-line max-len

      assert.dom('section.jobs p').hasText('Toggle to disable or enable the job.');
      assert.dom('.x-toggle-container').hasClass('x-toggle-container-checked'); // Sync should render

      assert.dom('section.sync li:first-child h4').hasText('SCM webhooks');
      assert.dom('section.sync li:nth-child(2) h4').hasText('Pull requests');
      assert.dom('section.sync li:last-child h4').hasText('Pipeline'); // Cache should render

      assert.dom('section.cache li:first-child h4').hasText('Pipeline');
      assert.dom('section.cache li:nth-child(2) h4').hasText('Job A');
      assert.dom('section.cache li:nth-child(3) h4').hasText('Job B');
      assert.dom('section.cache li:last-child h4').hasText('Job main'); // Danger Zone should not render

      assert.dom('section.danger h3').doesNotExist();
    });
    (0, _qunit.test)('it clears the pipeline cache', async function (assert) {
      cacheService = Ember.Service.extend({
        clearCache(config) {
          assert.equal(config.scope, 'pipelines');
          assert.equal(config.id, '1');
          return Ember.RSVP.resolve({});
        }

      });
      this.owner.register('service:cache', cacheService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.cache a');
    });
    (0, _qunit.test)('it clears the job cache', async function (assert) {
      cacheService = Ember.Service.extend({
        clearCache(config) {
          assert.equal(config.scope, 'jobs');
          assert.equal(config.id, '2345');
          return Ember.RSVP.resolve({});
        }

      });
      this.owner.register('service:cache', cacheService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      this.set('mockJobs', Ember.A([Ember.Object.create({
        id: '3456',
        name: 'B',
        isDisabled: false
      }), Ember.Object.create({
        id: '1234',
        name: 'main',
        isDisabled: false
      }), Ember.Object.create({
        id: '2345',
        name: 'A',
        isDisabled: false
      })]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "p6UKDpKb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\",\"jobs\"],[[25,[\"mockPipeline\"]],[25,[\"mockJobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.cache li:nth-child(2) a');
    });
    (0, _qunit.test)('it fails to clear the cache for the pipeline', async function (assert) {
      cacheService = Ember.Service.extend({
        clearCache() {
          return Ember.RSVP.reject('something conflicting');
        }

      });
      this.owner.register('service:cache', cacheService);
      this.set('mockPipeline', Ember.Object.create({
        appId: 'foo/bar',
        scmUri: 'github.com:84604643:master',
        id: '1'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "D9dM1lQj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-options\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('section.cache a');
      assert.dom('.alert > span').hasText('something conflicting');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-pr-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline pr list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const jobs = [Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'SUCCESS'
        }]
      }), Ember.Object.create({
        id: 'efgh',
        name: 'revert',
        createTimeWords: 'now',
        title: 'revert PR-1234',
        username: 'suomynona',
        builds: [{
          id: '1235',
          status: 'FAILURE'
        }]
      })];
      this.set('jobsMock', jobs);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "zSCcqWwz",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-list\",null,[[\"jobs\"],[[25,[\"jobsMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.view .view .detail').exists({
        count: 2
      });
      assert.dom('.title').hasText('update readme');
      assert.dom('.by').hasText('anonymous');
    });
    (0, _qunit.test)('it renders start build for restricted PR pipeline', async function (assert) {
      const jobs = [Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: []
      })];
      this.set('jobsMock', jobs);
      this.set('isRestricted', true);
      this.set('startBuild', Function.prototype);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "c0YDRwEm",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-list\",null,[[\"jobs\",\"isRestricted\",\"startBuild\"],[[25,[\"jobsMock\"]],[25,[\"isRestricted\"]],[25,[\"startBuild\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.view .view .detail').doesNotExist();
      assert.dom('.title').hasText('update readme');
      assert.dom('.by').hasText('anonymous');
      assert.dom('.view .startButton').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-pr-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline pr view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders a successful PR', async function (assert) {
      const job = Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'SUCCESS',
          startTimeWords: 'now'
        }]
      });
      this.set('jobMock', job);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cF1Ffj02",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.SUCCESS').exists({
        count: 1
      });
      assert.equal((0, _testHelpers.find)('.detail').textContent.trim().replace(/\s{2,}/g, ' '), 'main Started now');
      assert.dom('.date').hasText('Started now');
      assert.dom('.status .fa-check-circle-o').exists({
        count: 1
      });
    }); // When a user sets a job to unstable, it should show unstable icon

    (0, _qunit.test)('it renders an unstable PR', async function (assert) {
      const job = Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'UNSTABLE',
          startTimeWords: 'now'
        }]
      });
      this.set('jobMock', job);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cF1Ffj02",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.UNSTABLE').exists({
        count: 1
      });
      assert.dom('.fa-exclamation-circle').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it renders a failed PR', async function (assert) {
      const job = Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'FAILURE',
          startTimeWords: 'now'
        }]
      });
      this.set('jobMock', job);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cF1Ffj02",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.FAILURE').exists({
        count: 1
      });
      assert.dom('.fa-times-circle-o').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it renders a queued PR', async function (assert) {
      const job = Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'QUEUED',
          startTimeWords: 'now'
        }]
      });
      this.set('jobMock', job);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cF1Ffj02",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.QUEUED').exists({
        count: 1
      });
      assert.dom('.fa-spinner').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it renders a running PR', async function (assert) {
      const job = Ember.Object.create({
        id: 'abcd',
        name: 'PR-1234:main',
        createTimeWords: 'now',
        title: 'update readme',
        username: 'anonymous',
        builds: [{
          id: '1234',
          status: 'RUNNING',
          startTimeWords: 'now'
        }]
      });
      this.set('jobMock', job);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cF1Ffj02",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-pr-view\",null,[[\"job\"],[[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.RUNNING').exists({
        count: 1
      });
      assert.dom('.fa-spinner').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-rootdir/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline-rootdir', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "0z9mxfP2",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"pipeline-rootdir\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "O47FbMON",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-rootdir\",null,[[\"hasRootDir\"],[false]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.checkbox-input').exists({
        count: 1
      });
      assert.dom('.root-dir').doesNotExist();
    });
    (0, _qunit.test)('it renders with rootDir', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "0z9mxfP2",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"pipeline-rootdir\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "K/jiYQDv",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-rootdir\",null,[[\"hasRootDir\",\"rootDir\"],[true,\"lib\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.root-dir').hasValue('lib');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-secret-settings/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline secret settings', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const testSecret = Ember.Object.create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      this.set('mockSecrets', [testSecret]);
      const testPipeline = Ember.Object.create({
        id: '123245'
      });
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "w2wqeaAb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"secrets\",\"pipeline\"],[[25,[\"mockSecrets\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('p').hasText('User secrets must also be added to the Screwdriver YAML.'); // the table is present

      assert.dom('table').exists({
        count: 1
      });
      assert.dom('tbody tr').exists({
        count: 1
      });
      assert.dom('tfoot tr').exists({
        count: 1
      }); // eye-icons are present and have fa-eye class as default

      assert.dom('tbody i').hasClass('fa-eye');
      assert.dom('tfoot i').hasClass('fa-eye'); // the type of input is a password as default

      assert.dom('tbody .pass input').hasAttribute('type', 'password');
      assert.dom('tfoot .pass input').hasAttribute('type', 'password');
    });
    (0, _qunit.test)('it updates the add button properly', async function (assert) {
      this.set('mockPipeline', {
        id: 'abcd'
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "fxAP5KzK",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"pipeline\"],[[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      })); // starts disabled

      assert.dom('tfoot button').isDisabled(); // disabled when no value

      await (0, _testHelpers.fillIn)('.key input', 'SECRET_KEY');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      assert.dom('tfoot button').isDisabled(); // disabled when no key

      await (0, _testHelpers.fillIn)('.key input', '');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      await (0, _testHelpers.fillIn)('.pass input', 'SECRET_VAL');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      assert.dom('tfoot button').isDisabled(); // enabled when both present

      await (0, _testHelpers.fillIn)('.key input', 'SECRET_KEY');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      assert.dom('tfoot button').isNotDisabled(); // disabled again when no key

      await (0, _testHelpers.fillIn)('.key input', '');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      assert.dom('tfoot button').isDisabled();
    });
    (0, _qunit.test)('it calls action to create secret', async function (assert) {
      this.set('mockPipeline', {
        id: 'abcd'
      });
      this.set('externalAction', (name, value, id) => {
        assert.equal(name, 'SECRET_KEY');
        assert.equal(value, 'SECRET_VAL');
        assert.equal(id, 'abcd');
      }); // eslint-disable-next-line max-len

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "LFhi5wVm",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"pipeline\",\"onCreateSecret\"],[[25,[\"mockPipeline\"]],[29,\"action\",[[24,0,[]],[25,[\"externalAction\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.key input', 'SECRET_KEY');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      await (0, _testHelpers.fillIn)('.pass input', 'SECRET_VAL');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      await (0, _testHelpers.click)('tfoot button'); // and clears the new secret form elements

      assert.dom('.key input').hasValue('');
      assert.dom('.pass input').hasValue('');
      assert.dom('tfoot button').isDisabled('not disabled');
    });
    (0, _qunit.test)('it displays an error', async function (assert) {
      this.set('mockPipeline', {
        id: 'abcd'
      });
      this.set('externalAction', () => {
        assert.fail('should not get here');
      }); // eslint-disable-next-line max-len

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "LFhi5wVm",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"pipeline\",\"onCreateSecret\"],[[25,[\"mockPipeline\"]],[29,\"action\",[[24,0,[]],[25,[\"externalAction\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.key input', '0banana');
      await (0, _testHelpers.triggerKeyEvent)('.key input', 'keyup', 'ENTER');
      await (0, _testHelpers.fillIn)('.pass input', '0value');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      await (0, _testHelpers.click)('tfoot button'); // and clears the new secret form elements

      assert.dom('.alert > span').hasText('Secret keys can only consist of numbers, uppercase letters and underscores, ' + 'and cannot begin with a number.');
    });
    (0, _qunit.test)('it sorts secrets by name alphabetically', async function (assert) {
      const testSecret1 = Ember.Object.create({
        name: 'FOO',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      const testSecret2 = Ember.Object.create({
        name: 'BAR',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      const testSecret3 = Ember.Object.create({
        name: 'ZOO',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      this.set('mockSecrets', [testSecret1, testSecret2, testSecret3]);
      const testPipeline = Ember.Object.create({
        id: '123245'
      });
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "w2wqeaAb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"secrets\",\"pipeline\"],[[25,[\"mockSecrets\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      })); // secrets are sorted by name

      assert.dom((0, _testHelpers.find)('tbody tr:first-child td:first-child')).hasText('BAR');
      assert.dom((0, _testHelpers.find)('tbody tr:nth-child(2) td:first-child')).hasText('FOO');
      assert.dom((0, _testHelpers.find)('tbody tr:nth-child(3) td:first-child')).hasText('ZOO');
    });
    (0, _qunit.test)('it renders differently for a child pipeline', async function (assert) {
      const testSecret = Ember.Object.create({
        name: 'FOO',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      this.set('mockSecrets', [testSecret]);
      const testPipeline = Ember.Object.create({
        id: '123',
        configPipelineId: '123245'
      });
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "w2wqeaAb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"secrets\",\"pipeline\"],[[25,[\"mockSecrets\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('p').hasText('Secrets are inherited from the parent pipeline. You may override a secret or revert it back to its original value.'); // Secrets are rendered but footer is not

      assert.dom('table').exists({
        count: 1
      });
      assert.dom('tbody tr').exists({
        count: 1
      });
      assert.dom('tfoot tr').doesNotExist();
    });
    (0, _qunit.test)('it toggles eye-icon and input type', async function (assert) {
      const testSecret = Ember.Object.create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      this.set('mockSecrets', [testSecret]);
      const testPipeline = Ember.Object.create({
        id: '123245'
      });
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "w2wqeaAb",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-secret-settings\",null,[[\"secrets\",\"pipeline\"],[[25,[\"mockSecrets\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('tbody i');
      await (0, _testHelpers.click)('tfoot i');
      assert.dom('tbody i').hasClass('fa-eye-slash');
      assert.dom('tbody .pass input').hasAttribute('type', 'text');
      assert.dom('tfoot i').hasClass('fa-eye-slash');
      assert.dom('tfoot .pass input').hasAttribute('type', 'text');
      await (0, _testHelpers.click)('tbody i');
      await (0, _testHelpers.click)('tfoot i');
      assert.dom('tbody i').hasClass('fa-eye');
      assert.dom('tbody .pass input').hasAttribute('type', 'password');
      assert.dom('tfoot i').hasClass('fa-eye');
      assert.dom('tfoot .pass input').hasAttribute('type', 'password');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-start/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | pipeline start', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      assert.expect(2);
      this.set('onStartBuild', () => {
        assert.ok(true);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Z4RFVbtS",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-start\",null,[[\"startBuild\"],[[25,[\"onStartBuild\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('button').hasText('Start');
      await (0, _testHelpers.click)('button');
    });
    (0, _qunit.test)('it renders start PR', async function (assert) {
      assert.expect(3); // Starting PR job requires the PR number and PR jobs

      this.set('jobs', ['job1', 'job2']);
      this.set('onPRStartBuild', (prNum, prJobs) => {
        assert.equal(prNum, 5);
        assert.equal(prJobs.length, 2);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "wxT485kO",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-start\",null,[[\"startBuild\",\"prNum\",\"jobs\"],[[25,[\"onPRStartBuild\"]],5,[25,[\"jobs\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('button').hasText('Start PR-5');
      await (0, _testHelpers.click)('button');
    });
  });
});
define("screwdriver-ui/tests/integration/components/pipeline-workflow/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const GRAPH = {
    nodes: [{
      name: '~pr'
    }, {
      name: '~commit'
    }, {
      id: 1,
      name: 'main'
    }, {
      id: 2,
      name: 'batman'
    }, {
      id: 3,
      name: 'robin'
    }],
    edges: [{
      src: '~pr',
      dest: 'main'
    }, {
      src: '~commit',
      dest: 'main'
    }, {
      src: 'main',
      dest: 'batman'
    }, {
      src: 'batman',
      dest: 'robin'
    }]
  };
  const BUILDS = [{
    jobId: 1,
    id: 4,
    status: 'SUCCESS'
  }, {
    jobId: 2,
    id: 5,
    status: 'SUCCESS'
  }, {
    jobId: 3,
    id: 6,
    status: 'FAILURE'
  }];
  (0, _qunit.module)('Integration | Component | pipeline workflow', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders an aggregate', async function (assert) {
      const jobs = ['main', 'batman', 'robin'].map(name => {
        const j = {
          name,
          isDisabled: false,
          lastBuild: Ember.Object.create({
            id: 12345,
            status: 'SUCCESS',
            sha: 'abcd1234'
          })
        };
        return Ember.Object.create(j);
      });
      this.set('jobsMock', jobs);
      this.set('graph', GRAPH);
      this.set('selected', 'aggregate');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "9nwtdYHZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-workflow\",null,[[\"workflowGraph\",\"jobs\",\"selected\"],[[25,[\"graph\"]],[25,[\"jobsMock\"]],[25,[\"selected\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.graph-node').exists({
        count: 5
      });
      assert.dom('.workflow-tooltip').exists({
        count: 1
      });
    });
    (0, _qunit.test)('it renders an event', async function (assert) {
      this.set('selected', 1);
      this.set('obj', Ember.Object.create({
        builds: Ember.RSVP.resolve(BUILDS),
        workflowGraph: GRAPH,
        startFrom: '~commit',
        causeMessage: 'test'
      }));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "gXj4XTo+",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"pipeline-workflow\",null,[[\"selectedEventObj\",\"selected\"],[[25,[\"obj\"]],[25,[\"selected\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.graph-node').exists({
        count: 5
      });
      assert.dom('.workflow-tooltip').exists({
        count: 1
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/search-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "screwdriver-ui/tests/helpers/inject-session", "screwdriver-ui/tests/helpers/inject-scm"], function (_qunit, _emberQunit, _testHelpers, _injectSession, _injectScm) {
  "use strict";

  (0, _qunit.module)('Integration | Component | search list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders without collections', async function (assert) {
      (0, _injectScm.default)(this);
      const pipelines = [Ember.Object.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }), Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      const collections = [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      })];
      this.set('pipelineList', pipelines);
      this.set('collections', collections);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "WZgyKoBg",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"search-list\",null,[[\"pipelines\",\"collections\"],[[25,[\"pipelineList\"]],[25,[\"collections\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('tbody tr:first-child td.appId').hasText('batman/tumbler');
      assert.dom('tbody tr:first-child td.branch').hasText('waynecorp');
      assert.dom('tbody tr:first-child td.account').hasText('bitbucket.org');
      assert.dom('tbody tr:nth-child(2) td.appId').hasText('foo/bar');
      assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
      assert.dom('tbody tr:nth-child(2) td.account').hasText('github.com');
      assert.dom('.add-to-collection').doesNotExist();
    });
    (0, _qunit.test)('it renders with collections', async function (assert) {
      (0, _injectSession.default)(this);
      (0, _injectScm.default)(this);
      const pipelines = [Ember.Object.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }), Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      const collections = [Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds: [1, 2, 3]
      }), Ember.Object.create({
        id: 2,
        name: 'collection2',
        description: 'description2',
        pipelineIds: [4, 5, 6]
      })];
      this.set('pipelineList', pipelines);
      this.set('collections', collections);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "WZgyKoBg",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"search-list\",null,[[\"pipelines\",\"collections\"],[[25,[\"pipelineList\"]],[25,[\"collections\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('tbody tr:first-child td.appId').hasText('batman/tumbler');
      assert.dom('tbody tr:first-child td.branch').hasText('waynecorp');
      assert.dom('tbody tr:first-child td.account').hasText('bitbucket.org');
      assert.dom('tbody tr:nth-child(2) td.appId').hasText('foo/bar');
      assert.dom('tbody tr:nth-child(2) td.branch').hasText('master');
      assert.dom('tbody tr:nth-child(2) td.account').hasText('github.com');
      assert.dom('.add-to-collection').exists({
        count: 2
      });
      await (0, _testHelpers.click)('td.add .dropdown-toggle');
      assert.dom('td.add .dropdown-menu li:first-child span').hasText('collection1');
      assert.dom('td.add .dropdown-menu li:nth-child(2) span').hasText('collection2');
      assert.dom('td.add .dropdown-menu li:nth-child(3) span').hasText('CREATE');
    });
    (0, _qunit.test)('it filters the list', async function (assert) {
      (0, _injectScm.default)(this);
      const pipelines = [Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      this.set('pipelineList', pipelines);
      this.set('q', 'foo');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GvuHztFc",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"search-list\",null,[[\"pipelines\",\"query\"],[[25,[\"pipelineList\"]],[25,[\"q\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('tr').exists({
        count: 2
      });
      assert.dom('td.appId').hasText('foo/bar');
      assert.dom('td.branch').hasText('master');
      assert.dom('td.account').hasText('github.com');
    });
  });
});
define("screwdriver-ui/tests/integration/components/secret-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | secret view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const testSecret = Ember.Object.create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: 'banana',
        allowInPR: false
      });
      this.set('mockSecret', testSecret);
      const testPipeline = Ember.Object.create({
        id: '123245'
      });
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3FUKuuUQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"secret-view\",null,[[\"secret\",\"pipeline\"],[[25,[\"mockSecret\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.name').hasText('TEST_SECRET');
      assert.dom('.pass input').hasAttribute('placeholder', 'Protected');
      assert.dom('.pass input').hasNoValue();
      assert.dom('.allow input').isNotChecked();
      assert.dom('button').hasText('Delete'); // button value changes when user types a new value

      await (0, _testHelpers.fillIn)('.pass input', 'banana');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      assert.dom('button').hasText('Update'); // button value changes when user types a new value

      await (0, _testHelpers.fillIn)('.pass input', '');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      assert.dom('button').hasText('Delete'); // button value changes when user click the checkbox

      await (0, _testHelpers.click)('.allow input');
      assert.dom('button').hasText('Update'); // button value changes when user click the checkbox again to change it back

      await (0, _testHelpers.click)('.allow input');
      assert.dom('button').hasText('Delete');
    });
    (0, _qunit.test)('it trys to delete a secret', async function (assert) {
      assert.expect(3);
      const testPipeline = Ember.Object.create({
        id: '123245'
      });
      this.set('mockSecret', Ember.Object.extend({
        destroyRecord() {
          // destroy called
          assert.ok(true);
          return Promise.resolve(null);
        },

        save() {
          // update called: Fail!
          assert.ok(false);
        }

      }).create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      }));
      this.set('mockPipeline', testPipeline);
      this.set('secrets', {
        store: {
          unloadRecord: secret => {
            assert.equal(secret.name, 'TEST_SECRET');
          }
        },
        reload: () => {
          // reload called
          assert.ok(true);
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "1xfurg1L",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"secret-view\",null,[[\"secret\",\"secrets\",\"pipeline\"],[[25,[\"mockSecret\"]],[25,[\"secrets\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('button');
    });
    (0, _qunit.test)('it saves changes to a secret', async function (assert) {
      assert.expect(2);
      const testPipeline = Ember.Object.create({
        id: '123245'
      }); // Setting up model so `set` works as expected

      this.set('mockSecret', Ember.Object.extend({
        destroyRecord() {
          // destroy called: Fail!
          assert.ok(false);
        },

        save() {
          // update called
          assert.equal(this.get('value'), 'banana');
          assert.equal(this.get('allowInPR'), true);
        }

      }).create({
        name: 'TEST_SECRET',
        pipelineId: 123245,
        value: null,
        allowInPR: false
      }));
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3FUKuuUQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"secret-view\",null,[[\"secret\",\"pipeline\"],[[25,[\"mockSecret\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.pass input', 'banana');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      await (0, _testHelpers.click)('.allow input');
      await (0, _testHelpers.click)('button');
    });
    (0, _qunit.test)('it renders secrets for child pipeline', async function (assert) {
      assert.expect(2);
      const testSecret = Ember.Object.create({
        name: 'TEST_SECRET',
        pipelineId: '123245',
        value: 'banana',
        allowInPR: false
      });
      const testPipeline = Ember.Object.create({
        id: '123',
        configPipelineId: '123245'
      });
      this.set('mockSecret', testSecret);
      this.set('mockPipeline', testPipeline);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3FUKuuUQ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"secret-view\",null,[[\"secret\",\"pipeline\"],[[25,[\"mockSecret\"]],[25,[\"mockPipeline\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.pass input').hasAttribute('placeholder', 'Inherited from parent pipeline');
      assert.dom('button').hasText('Override');
    });
    (0, _qunit.test)('it overrides a secret for a child pipeline', async function (assert) {
      assert.expect(3);
      const testSecret = Ember.Object.create({
        name: 'TEST_SECRET',
        pipelineId: '123245',
        value: 'banana',
        allowInPR: false
      });
      const testPipeline = Ember.Object.create({
        id: '123',
        configPipelineId: '123245'
      });
      this.set('mockSecret', testSecret);
      this.set('mockPipeline', testPipeline);
      this.set('externalAction', (name, value, id) => {
        assert.equal(name, 'TEST_SECRET');
        assert.equal(value, 'apple');
        assert.equal(id, '123');
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "66NzLbEc",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"secret-view\",null,[[\"secret\",\"pipeline\",\"onCreateSecret\"],[[25,[\"mockSecret\"]],[25,[\"mockPipeline\"]],[29,\"action\",[[24,0,[]],[25,[\"externalAction\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.pass input', 'apple');
      await (0, _testHelpers.triggerKeyEvent)('.pass input', 'keyup', 'ENTER');
      await (0, _testHelpers.click)('button');
    });
  });
});
define("screwdriver-ui/tests/integration/components/tc-collection-linker/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const TEMPLATE_DATA_WITH_NAME = {
    column: {
      label: 'Name'
    },
    extra: {
      routes: {
        namespace: 'collection.namespace',
        detail: 'collection.detail'
      }
    },
    row: {
      content: {
        namespace: 'foo',
        name: 'bar'
      }
    },
    value: 'bar'
  };
  const TEMPLATE_DATA_WITH_NAMESPACE = {
    column: {
      label: 'Namespace'
    },
    extra: {
      routes: {
        namespace: 'collection.namespace',
        detail: 'collection.detail'
      }
    },
    row: {
      content: {
        namespace: 'baz'
      }
    },
    value: 'baz'
  };
  (0, _qunit.module)('Integration | Component | tc collection linker', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders the link to collection namespace page', async function (assert) {
      Object.keys(TEMPLATE_DATA_WITH_NAMESPACE).forEach(prop => this.set(prop, TEMPLATE_DATA_WITH_NAMESPACE[prop]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "MoSuYmBG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"tc-collection-linker\",null,[[\"column\",\"extra\",\"value\"],[[25,[\"column\"]],[25,[\"extra\"]],[25,[\"value\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('a .namespace').hasText('baz');
    });
    (0, _qunit.test)('it renders the link to collection detail page', async function (assert) {
      Object.keys(TEMPLATE_DATA_WITH_NAME).forEach(prop => this.set(prop, TEMPLATE_DATA_WITH_NAME[prop]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "MoSuYmBG",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"tc-collection-linker\",null,[[\"column\",\"extra\",\"value\"],[[25,[\"column\"]],[25,[\"extra\"]],[25,[\"value\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('a .name').hasText('bar');
    });
  });
});
define("screwdriver-ui/tests/integration/components/tc-collection-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers", "ember-responsive/test-support"], function (_qunit, _emberQunit, _testHelpers, _testSupport) {
  "use strict";

  const TEST_TEMPLATES = {
    model: [{
      id: 2,
      description: 'A test example',
      labels: ['car', 'armored'],
      maintainer: 'bruce@wayne.com',
      name: 'bar',
      namespace: 'foo',
      version: '2.0.0'
    }, {
      id: 3,
      description: 'A fruity example',
      labels: ['fruit'],
      maintainer: 'thomas@wayne.com',
      name: 'strawberry',
      namespace: 'banana',
      version: '1.0.0'
    }],
    targetNamespace: 'foo'
  };
  (0, _qunit.module)('Integration | Component | tc collection list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      (0, _testSupport.setBreakpoint)('desktop');
      Object.keys(TEST_TEMPLATES).forEach(prop => this.set(prop, TEST_TEMPLATES[prop]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JJS+Ifob",
        "block": "{\"symbols\":[],\"statements\":[[4,\"tc-collection-list\",null,[[\"model\",\"collectionType\"],[[25,[\"model\"]],\"Collection\"]],{\"statements\":[[0,\"      This is a collection\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('header h4 a').hasText('Collection Docs');
      assert.dom('header h4 a').hasAttribute('href', 'http://docs.screwdriver.cd/user-guide/collection');
      assert.dom('.collection-list-table th').exists({
        count: 6
      });
      assert.dom('.collection-list-table .lt-body td').exists({
        count: 12
      });
    });
    (0, _qunit.test)('it renders with filter namespace', async function (assert) {
      (0, _testSupport.setBreakpoint)('desktop');
      Object.keys(TEST_TEMPLATES).forEach(prop => this.set(prop, TEST_TEMPLATES[prop]));
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "2FM3OjvG",
        "block": "{\"symbols\":[],\"statements\":[[4,\"tc-collection-list\",null,[[\"model\",\"filteringNamespace\",\"collectionType\"],[[25,[\"model\"]],[25,[\"targetNamespace\"]],\"Collection\"]],{\"statements\":[[0,\"      This is a collection\\n\"]],\"parameters\":[]},null]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('header h4 a').hasText('Collection Docs');
      assert.dom('header h4 a').hasAttribute('href', 'http://docs.screwdriver.cd/user-guide/collection');
      assert.dom('.collection-list-table th').exists({
        count: 6
      });
      assert.dom('.collection-list-table .lt-body td').exists({
        count: 6
      });
    });
  });
});
define("screwdriver-ui/tests/integration/components/template-header/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const TEMPLATE = {
    id: 2,
    config: {
      image: 'node:8'
    },
    createTime: '2018-06-16T00:36:50.603Z',
    description: 'A test example',
    labels: ['car', 'armored'],
    maintainer: 'bruce@wayne.com',
    pipelineId: 1,
    namespace: 'foo',
    name: 'bar',
    fullName: 'foo/bar',
    version: '2.0.0',
    images: {
      stable: 'node:6',
      development: 'node:7'
    }
  };
  const mockPipeline = {
    id: 1,
    scmRepo: {
      url: 'github.com/screwdriver-cd'
    },

    get(key) {
      return this[key];
    }

  };
  (0, _qunit.module)('Integration | Component | template header', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const storeStub = Ember.Service.extend({
        findRecord() {
          return new Ember.RSVP.Promise(resolve => resolve(mockPipeline));
        }

      });
      this.set('mock', TEMPLATE);
      this.owner.unregister('service:store');
      this.owner.register('service:store', storeStub);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "0j5U9XUn",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"template-header\",null,[[\"template\"],[[25,[\"mock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h1').hasText('foo/bar');
      assert.dom('h2').hasText('2.0.0');
      assert.dom('p').hasText('A test example');
      assert.dom('#template-namespace').hasText('Namespace: foo');
      assert.dom('#template-name').hasText('Name: bar');
      assert.dom('#template-maintainer').hasText('Released by: bruce@wayne.com');
      assert.dom('#template-maintainer > .template-details--value > a').hasAttribute('href', 'mailto:bruce@wayne.com');
      assert.dom('#template-tags').hasText('Tags: car armored');
      assert.dom('h4').hasText('Usage:');
      assert.dom('pre').hasText('jobs: main: template: foo/bar@2.0.0');
    });
  });
});
define("screwdriver-ui/tests/integration/components/template-versions/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  const TEMPLATES = [{
    version: '3.0.0',
    tag: 'latest stable'
  }, {
    version: '2.0.0',
    tag: 'meeseeks'
  }, {
    version: '1.0.0'
  }];
  (0, _qunit.module)('Integration | Component | template versions', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    hooks.beforeEach(function () {
      this.actions = {};

      this.send = (actionName, ...args) => this.actions[actionName].apply(this, args);
    });
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('mock', TEMPLATES);

      this.actions.mockAction = function () {};

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "k5WFndvv",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"template-versions\",null,[[\"templates\",\"changeVersion\"],[[25,[\"mock\"]],[29,\"action\",[[24,0,[]],\"mockAction\"],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Versions:');
      assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
      assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
      assert.dom('ul li:last-child').hasText('1.0.0');
    });
    (0, _qunit.test)('it handles clicks on versions', async function (assert) {
      assert.expect(5);
      this.set('mock', TEMPLATES);

      this.actions.mockAction = function (ver) {
        assert.equal(ver, '1.0.0');
      };

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "k5WFndvv",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"template-versions\",null,[[\"templates\",\"changeVersion\"],[[25,[\"mock\"]],[29,\"action\",[[24,0,[]],\"mockAction\"],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('Versions:');
      assert.dom('ul li:first-child').hasText('3.0.0 - latest stable');
      assert.dom('ul li:nth-child(2)').hasText('2.0.0 - meeseeks');
      assert.dom('ul li:last-child').hasText('1.0.0');
      await (0, _testHelpers.click)('ul li:last-child span');
    });
  });
});
define("screwdriver-ui/tests/integration/components/token-list/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | token list', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('tokens', [Ember.Object.create({
        id: 1,
        name: 'foo',
        description: 'bar'
      }), Ember.Object.create({
        id: 2,
        name: 'baz',
        description: 'qux'
      })]);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ATrQTpW8",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"token-list\",null,[[\"tokens\"],[[25,[\"tokens\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('td.name input').hasValue('baz');
      assert.dom('td.description input').hasValue('qux');
      assert.dom('tr:nth-child(2) td.name input').hasValue('foo');
      assert.dom('tr:nth-child(2) td.description input').hasValue('bar');
    });
  });
});
define("screwdriver-ui/tests/integration/components/token-view/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | token view', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const testToken = Ember.Object.create({
        name: 'TEST_TOKEN',
        description: 'hunter2'
      });
      this.set('mockToken', testToken);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VyUwRZBk",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"token-view\",null,[[\"token\"],[[25,[\"mockToken\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.name input').hasValue('TEST_TOKEN');
      assert.dom('.description input').hasValue('hunter2');
      assert.dom('button:last-child').hasText('Delete'); // button value changes when user types a new name

      await (0, _testHelpers.fillIn)('.name input', 'TEST_TOKEN_2');
      await (0, _testHelpers.triggerEvent)('.name input', 'keyup');
      assert.dom('button:last-child').hasText('Update'); // button value reverts if the new name is the same as the original

      await (0, _testHelpers.fillIn)('.name input', 'TEST_TOKEN');
      await (0, _testHelpers.triggerEvent)('.name input', 'keyup');
      assert.dom('button:last-child').hasText('Delete'); // button value changes when user types a new description

      await (0, _testHelpers.fillIn)('.description input', 'hunter3');
      await (0, _testHelpers.triggerEvent)('.description input', 'keyup');
      assert.dom('button:last-child').hasText('Update'); // button value reverts if the new description is the same as the original

      await (0, _testHelpers.fillIn)('.description input', 'hunter2');
      await (0, _testHelpers.triggerEvent)('.description input', 'keyup');
      assert.dom('button:last-child').hasText('Delete');
    });
    (0, _qunit.test)('it trys to delete a token', async function (assert) {
      assert.expect(2);
      this.set('mockToken', Ember.Object.create({
        name: 'TEST_TOKEN',
        description: 'hunter2'
      }));
      this.set('confirmAction', (action, id) => {
        assert.equal(action, 'delete');
        assert.equal(id, this.get('mockToken.id'));
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3NUfSp3V",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"token-view\",null,[[\"token\",\"confirmAction\"],[[25,[\"mockToken\"]],[29,\"action\",[[24,0,[]],[25,[\"confirmAction\"]]],null]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.click)('button:last-child');
    });
    (0, _qunit.test)('it saves changes to a token', async function (assert) {
      let expectIsSaving = true;
      assert.expect(3); // Setting up model so `set` works as expected

      this.set('mockToken', Ember.Object.extend({
        destroyRecord() {
          // destroy called: Fail!
          assert.ok(false);
        },

        save() {
          // update called
          assert.equal(this.get('name'), 'TEST_TOKEN_2');
          expectIsSaving = false;
          return Ember.RSVP.resolve();
        }

      }).create({
        name: 'TEST_TOKEN',
        description: 'hunter2'
      }));
      this.set('setIsSavingMock', isSaving => {
        assert.equal(expectIsSaving, isSaving);
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "7B+UEIvw",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"token-view\",null,[[\"token\",\"setIsSaving\"],[[25,[\"mockToken\"]],[25,[\"setIsSavingMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      await (0, _testHelpers.fillIn)('.name input', 'TEST_TOKEN_2');
      await (0, _testHelpers.triggerEvent)('.name input', 'keyup');
      await (0, _testHelpers.click)('button:last-child');
    });
  });
});
define("screwdriver-ui/tests/integration/components/user-link/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | user link', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      const userMock = {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      };
      this.set('userMock', userMock);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "5tuMp1g5",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"user-link\",null,[[\"user\",\"causeMessage\"],[[25,[\"userMock\"]],\"merged it\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.equal((0, _testHelpers.find)('a').href, 'http://example.com/u/batman');
      assert.equal((0, _testHelpers.find)('a').title, 'merged it');
      assert.equal((0, _testHelpers.find)('img').src, 'http://example.com/u/batman/avatar');
      assert.dom('a').hasText('Bruce W');
    });
  });
});
define("screwdriver-ui/tests/integration/components/validator-input/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | validator input', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JOaAwWDi",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"validator-input\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h3').hasText('Validate Screwdriver Configuration');
    });
  });
});
define("screwdriver-ui/tests/integration/components/validator-job/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | validator job', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        commands: [{
          name: 'step1',
          command: 'echo hello'
        }, {
          name: 'step2',
          command: 'echo goodbye'
        }],
        secrets: [],
        environment: {},
        settings: {}
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "s3OxPIwh",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",0,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test');
      assert.dom('.image .label').hasText('Image:');
      assert.dom('.image .value').hasText('int-test:1');
      assert.dom('.steps .label').hasText('Steps:');
      assert.dom('.steps ul li:first-child .value').hasText('echo hello');
      assert.dom('.steps ul li:last-child .value').hasText('echo goodbye');
      assert.dom('.secrets .label').hasText('Secrets:');
      assert.dom('.secrets ul li').hasText('None defined');
      assert.dom('.env .label').hasText('Environment Variables:');
      assert.dom('.env ul li').hasText('None defined');
      assert.dom('.settings .label').hasText('Settings:');
      assert.dom('.settings ul li').hasText('None defined');
      assert.dom('.annotations .label').hasText('Annotations:');
      assert.dom('.annotations .value').hasText('None defined');
    });
    (0, _qunit.test)('it renders a template, description, images', async function (assert) {
      this.set('templateMock', {
        description: 'Test template',
        maintainer: 'bruce@wayne.com',
        images: {
          stable: 'node:6',
          development: 'node:7'
        },
        name: 'test',
        namespace: 'batman',
        version: '2.0.0'
      });
      this.set('jobMock', {
        image: 'int-test:1',
        commands: [{
          name: 'step1',
          command: 'echo hello'
        }, {
          name: 'step2',
          command: 'echo goodbye'
        }],
        secrets: ['FOO', 'BAR'],
        environment: {
          FOO: 'bar'
        },
        settings: {
          FOO: 'bar'
        },
        annotations: {
          FOO: 'bar'
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "3dy+gd80",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\",\"template\"],[\"int-test\",0,[25,[\"jobMock\"]],[25,[\"templateMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.template-description .label').hasText('Template Description:');
      assert.dom('.template-description .value').hasText('Test template');
      assert.dom('.images > .label').hasText('Supported Images:');
      assert.dom('.images > .value > ul > li:first-child').hasText('stable: node:6');
      assert.dom('.images > .value > ul > li:nth-child(2)').hasText('development: node:7');
    });
    (0, _qunit.test)('it renders settings, env, secrets, annotations', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        commands: [{
          name: 'step1',
          command: 'echo hello'
        }, {
          name: 'step2',
          command: 'echo goodbye'
        }],
        secrets: ['FOO', 'BAR'],
        environment: {
          FOO: 'bar'
        },
        settings: {
          FOO: 'bar'
        },
        annotations: {
          FOO: 'bar'
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "s3OxPIwh",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",0,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test');
      assert.dom('.secrets .label').hasText('Secrets:');
      assert.dom('.secrets ul li:first-child').hasText('FOO');
      assert.dom('.secrets ul li:last-child').hasText('BAR');
      assert.dom('.env .label').hasText('Environment Variables:');
      assert.dom('.env ul li').hasText('FOO: bar');
      assert.dom('.settings .label').hasText('Settings:');
      assert.dom('.settings ul li').hasText('FOO: bar');
      assert.dom('.annotations .label').hasText('Annotations:');
      assert.dom('.annotations ul li').hasText('FOO: bar');
    });
    (0, _qunit.test)('it renders template steps', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        steps: [{
          step1: 'echo hello'
        }, {
          step2: 'echo goodbye'
        }],
        secrets: [],
        environment: {},
        settings: {},
        annotations: {}
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "s3OxPIwh",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",0,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test');
      assert.dom('.image .label').hasText('Image:');
      assert.dom('.image .value').hasText('int-test:1');
      assert.dom('.steps .label').hasText('Steps:');
      assert.dom('.steps ul li:first-child .value').hasText('echo hello');
      assert.dom('.steps ul li:last-child .value').hasText('echo goodbye');
      assert.dom('.secrets .label').hasText('Secrets:');
      assert.dom('.secrets ul li').hasText('None defined');
      assert.dom('.env .label').hasText('Environment Variables:');
      assert.dom('.env ul li').hasText('None defined');
      assert.dom('.settings .label').hasText('Settings:');
      assert.dom('.settings ul li').hasText('None defined');
      assert.dom('.annotations .label').hasText('Annotations:');
      assert.dom('.annotations .value').hasText('None defined');
      assert.dom('.sourcePaths .label').hasText('Source Paths:');
      assert.dom('.sourcePaths ul li').hasText('None defined');
    });
    (0, _qunit.test)('it renders when there are no steps or commands', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        secrets: [],
        environment: {},
        settings: {},
        annotations: {}
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "5OAiE3NE",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",1,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test.1');
      assert.dom('.steps .label').hasText('Steps:');
      assert.dom('.steps ul .value').doesNotExist();
    });
    (0, _qunit.test)('it handles clicks on header', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        commands: [{
          name: 'step1',
          command: 'echo hello'
        }, {
          name: 'step2',
          command: 'echo goodbye'
        }],
        secrets: ['FOO', 'BAR'],
        environment: {
          FOO: 'bar'
        },
        settings: {
          FOO: 'bar'
        },
        annotations: {}
      });
      this.set('openMock', true);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Ta0jDG0v",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\",\"isOpen\"],[\"int-test\",0,[25,[\"jobMock\"]],[25,[\"openMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.ok(this.get('openMock'));
      await (0, _testHelpers.click)('h4');
      assert.notOk(this.get('openMock'));
      await (0, _testHelpers.click)('h4');
      assert.ok(this.get('openMock'));
    });
    (0, _qunit.test)('it renders a description', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        description: 'This is a description',
        secrets: [],
        environment: {},
        settings: {},
        annotations: {}
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "s3OxPIwh",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",0,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test');
      assert.dom('.description .label').hasText('Description:');
      assert.dom('.description .value').hasText('This is a description');
    });
    (0, _qunit.test)('it renders sourcePaths', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        description: 'This is a description',
        secrets: [],
        environment: {},
        settings: {},
        annotations: {},
        sourcePaths: ['README.md', 'src/folder/']
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "s3OxPIwh",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\"],[\"int-test\",0,[25,[\"jobMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').hasText('int-test');
      assert.dom('.sourcePaths .label').hasText('Source Paths:');
      assert.dom('.sourcePaths .value ul li:first-child').hasText('README.md');
      assert.dom('.sourcePaths .value ul li:last-child').hasText('src/folder/');
    });
    (0, _qunit.test)('it renders without a collapsible heading', async function (assert) {
      this.set('jobMock', {
        image: 'int-test:1',
        commands: [{
          name: 'step1',
          command: 'echo hello'
        }, {
          name: 'step2',
          command: 'echo goodbye'
        }],
        secrets: [],
        environment: {},
        settings: {}
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "mGVoUeNw",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-job\",null,[[\"name\",\"index\",\"job\",\"collapsible\"],[\"int-test\",0,[25,[\"jobMock\"]],false]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4').doesNotExist();
    });
  });
});
define("screwdriver-ui/tests/integration/components/validator-pipeline/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | validator pipeline', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders default empty settings', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "BXnF8VEm",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"validator-pipeline\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('h4.pipeline').hasText('Pipeline Settings');
      assert.dom('.annotations .label').hasText('Annotations:');
      assert.dom('.annotations ul li').hasText('None defined');
      assert.dom('.workflow .label').hasText('Workflow:');
      assert.ok(this.$('.workflow canvas'), 'workflow canvas');
    });
    (0, _qunit.test)('it renders pipeline annotations and workflow', async function (assert) {
      this.set('plMock', {
        annotations: {
          hello: 'hi'
        },
        workflow: ['firstjob', 'secondjob']
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "jZ9Aiuv9",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-pipeline\",null,[[\"annotations\",\"workflow\"],[[25,[\"plMock\",\"annotations\"]],[25,[\"plMock\",\"workflow\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.annotations .label').hasText('Annotations:');
      assert.dom('.annotations ul li').hasText('hello: hi');
      assert.dom('.workflow .label').hasText('Workflow:');
      assert.ok(this.$('.workflow canvas'), 'workflow canvas');
    });
  });
});
define("screwdriver-ui/tests/integration/components/validator-results/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | validator results', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders jobs', async function (assert) {
      this.set('validationMock', {
        errors: ['got an error'],
        workflow: ['main', 'foo'],
        workflowGraph: {
          nodes: [{
            name: '~pr'
          }, {
            name: '~commit'
          }, {
            name: 'main'
          }, {
            name: 'foo'
          }],
          edges: []
        },
        jobs: {
          foo: [{
            image: 'int-test:1',
            commands: [{
              name: 'step1',
              command: 'echo hello'
            }, {
              name: 'step2',
              command: 'echo goodbye'
            }],
            secrets: [],
            environment: {},
            settings: {}
          }],
          main: [{
            image: 'int-test:1',
            commands: [{
              name: 'step1',
              command: 'echo hello'
            }, {
              name: 'step2',
              command: 'echo goodbye'
            }],
            secrets: [],
            environment: {},
            settings: {}
          }, {
            image: 'int-test:1',
            commands: [{
              name: 'step1',
              command: 'echo hello'
            }, {
              name: 'step2',
              command: 'echo goodbye'
            }],
            secrets: [],
            environment: {},
            settings: {}
          }]
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "U8bmmMd0",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-results\",null,[[\"results\"],[[25,[\"validationMock\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const jobs = (0, _testHelpers.findAll)('h4.job');
      assert.dom(jobs[0]).hasText('main');
      assert.dom(jobs[1]).hasText('main.1');
      assert.dom(jobs[2]).hasText('foo');
      assert.dom('.error').hasText('got an error');
      assert.dom('h4.pipeline').hasText('Pipeline Settings');
    });
    (0, _qunit.test)('it renders templates', async function (assert) {
      this.set('validationMock', {
        errors: [],
        template: {
          name: 'batman/batmobile',
          version: '1.0.0',
          config: {
            image: 'int-test:1',
            steps: [{
              forgreatjustice: 'ba.sh'
            }]
          }
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GeY5iBih",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-results\",null,[[\"results\",\"isTemplate\"],[[25,[\"validationMock\"]],true]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.error').doesNotExist();
      assert.dom('h4').hasText('batman/batmobile@1.0.0');
    });
    (0, _qunit.test)('it renders templates with a namespace', async function (assert) {
      this.set('validationMock', {
        errors: [],
        template: {
          namespace: 'batman',
          name: 'batmobile',
          version: '1.0.0',
          config: {
            image: 'int-test:1',
            steps: [{
              forgreatjustice: 'ba.sh'
            }]
          }
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GeY5iBih",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-results\",null,[[\"results\",\"isTemplate\"],[[25,[\"validationMock\"]],true]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.error').doesNotExist();
      assert.dom('h4').hasText('batman/batmobile@1.0.0');
    });
    (0, _qunit.test)('it renders joi error results', async function (assert) {
      this.set('validationMock', {
        errors: [{
          message: 'there is an error'
        }],
        template: {
          name: 'batman/batmobile',
          version: '1.0.0',
          config: {
            image: 'int-test:1',
            steps: [{
              forgreatjustice: 'ba.sh'
            }]
          }
        }
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "GeY5iBih",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"validator-results\",null,[[\"results\",\"isTemplate\"],[[25,[\"validationMock\"]],true]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.error').hasText('there is an error');
      assert.dom('h4').hasText('batman/batmobile@1.0.0');
    });
  });
});
define("screwdriver-ui/tests/integration/components/workflow-graph-d3/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | workflow graph d3', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders empty when no graph supplied', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "RB4BRT7j",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"workflow-graph-d3\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('svg').exists({
        count: 1
      });
      assert.equal(this.$('svg').children().length, 0);
    });
    (0, _qunit.test)('it renders nodes and edges when a graph is supplied', async function (assert) {
      this.set('workflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          name: 'main'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }]
      });
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "ujLJy9b5",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\"],[[25,[\"workflowGraph\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const svg = this.$('svg');
      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 3);
      assert.equal(svg.children('path.graph-edge').length, 2);
    });
    (0, _qunit.test)('it renders a complete graph with triggers when showDownstreamTriggers is true', async function (assert) {
      this.set('workflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          name: 'main'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }]
      });
      this.set('completeWorkflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          name: 'main'
        }, {
          name: '~sd-main-trigger'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }, {
          src: 'main',
          dest: '~sd-main-trigger'
        }]
      });
      this.set('showDownstreamTriggers', true);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "JijgHnVF",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\",\"completeWorkflowGraph\",\"showDownstreamTriggers\"],[[25,[\"workflowGraph\"]],[25,[\"completeWorkflowGraph\"]],[25,[\"showDownstreamTriggers\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const svg = this.$('svg');
      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 4);
      assert.equal(svg.children('path.graph-edge').length, 3);
    });
    (0, _qunit.test)('it renders statuses when build data is available', async function (assert) {
      this.set('workflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          id: 1,
          name: 'main'
        }, {
          id: 2,
          name: 'A'
        }, {
          id: 3,
          name: 'B'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }, {
          src: 'main',
          dest: 'A'
        }, {
          src: 'A',
          dest: 'B'
        }]
      });
      this.set('startFrom', '~commit');
      this.set('builds', [{
        jobId: 1,
        id: 4,
        status: 'SUCCESS'
      }, {
        jobId: 2,
        id: 5,
        status: 'SUCCESS'
      }, {
        jobId: 3,
        id: 6,
        status: 'FAILURE'
      }]);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "euYOnRtj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\",\"builds\",\"startFrom\"],[[25,[\"workflowGraph\"]],[25,[\"builds\"]],[25,[\"startFrom\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const svg = this.$('svg');
      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 5);
      assert.equal(svg.children('g.graph-node.build-success').length, 2);
      assert.equal(svg.children('g.graph-node.build-failure').length, 1);
      assert.equal(svg.children('g.graph-node.build-started_from').length, 1);
      assert.equal(svg.children('path.graph-edge').length, 4);
      assert.equal(svg.children('path.graph-edge.build-started_from').length, 1);
      assert.equal(svg.children('path.graph-edge.build-success').length, 2);
    });
    (0, _qunit.test)('it does not render startFrom icon when starting in the middle of the graph', async function (assert) {
      this.set('workflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          id: 1,
          name: 'main'
        }, {
          id: 2,
          name: 'A'
        }, {
          id: 3,
          name: 'B'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }, {
          src: 'main',
          dest: 'A'
        }, {
          src: 'A',
          dest: 'B'
        }]
      });
      this.set('startFrom', 'A');
      this.set('builds', [{
        jobId: 2,
        id: 5,
        status: 'SUCCESS'
      }, {
        jobId: 3,
        id: 6,
        status: 'FAILURE'
      }]);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "euYOnRtj",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\",\"builds\",\"startFrom\"],[[25,[\"workflowGraph\"]],[25,[\"builds\"]],[25,[\"startFrom\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const svg = this.$('svg');
      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 5);
      assert.equal(svg.children('g.graph-node.build-success').length, 1);
      assert.equal(svg.children('g.graph-node.build-failure').length, 1);
      assert.equal(svg.children('g.graph-node.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge').length, 4);
      assert.equal(svg.children('path.graph-edge.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge.build-success').length, 1);
    });
    (0, _qunit.test)('it can renders subgraph for minified case', async function (assert) {
      this.set('workflowGraph', {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          id: 1,
          name: 'main'
        }, {
          id: 2,
          name: 'A'
        }, {
          id: 3,
          name: 'B'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }, {
          src: 'main',
          dest: 'A'
        }, {
          src: 'A',
          dest: 'B'
        }]
      });
      this.set('startFrom', 'A');
      this.set('builds', [{
        jobId: 2,
        id: 5,
        status: 'SUCCESS'
      }, {
        jobId: 3,
        id: 6,
        status: 'FAILURE'
      }]);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "zrvqbwTv",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-graph-d3\",null,[[\"workflowGraph\",\"builds\",\"startFrom\",\"minified\"],[[25,[\"workflowGraph\"]],[25,[\"builds\"]],[25,[\"startFrom\"]],true]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      const svg = this.$('svg');
      assert.equal(svg.length, 1);
      assert.equal(svg.children('g.graph-node').length, 2);
      assert.equal(svg.children('g.graph-node.build-success').length, 1);
      assert.equal(svg.children('g.graph-node.build-failure').length, 1);
      assert.equal(svg.children('g.graph-node.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge').length, 1);
      assert.equal(svg.children('path.graph-edge.build-started_from').length, 0);
      assert.equal(svg.children('path.graph-edge.build-success').length, 1);
    });
  });
});
define("screwdriver-ui/tests/integration/components/workflow-tooltip/component-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Integration | Component | workflow tooltip', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders', async function (assert) {
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "VgAM7ld4",
        "block": "{\"symbols\":[],\"statements\":[[1,[23,\"workflow-tooltip\"],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).hasText('Go to build metrics'); // Template block usage:

      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Ywqv2I8s",
        "block": "{\"symbols\":[],\"statements\":[[0,\"\\n\"],[4,\"workflow-tooltip\",null,null,{\"statements\":[[0,\"        template block text\\n\"]],\"parameters\":[]},null],[0,\"    \"]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).includesText('template block text');
    });
    (0, _qunit.test)('it renders build detail and metrics links', async function (assert) {
      const data = {
        job: {
          id: 1,
          buildId: 1234,
          name: 'batmobile'
        }
      };
      this.set('data', data);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "griJDeEZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\"],[[25,[\"data\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.content a').exists({
        count: 2
      });
      assert.dom('a:first-child').hasText('Go to build details');
      assert.dom('a:last-child').hasText('Go to build metrics');
    });
    (0, _qunit.test)('it renders remote trigger link', async function (assert) {
      const data = {
        externalTrigger: {
          pipelineId: 1234,
          jobName: 'main'
        }
      };
      this.set('data', data);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "griJDeEZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\"],[[25,[\"data\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.content a').exists({
        count: 1
      });
      assert.dom(this.element).hasText('Go to remote pipeline');
    });
    (0, _qunit.test)('it renders downstream trigger links', async function (assert) {
      const data = {
        triggers: [{
          pipelineId: 1234,
          jobName: 'main',
          triggerName: '~sd@1234:main'
        }, {
          pipelineId: 2,
          jobName: 'prod',
          triggerName: '~sd@2:prod'
        }]
      };
      this.set('data', data);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "griJDeEZ",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\"],[[25,[\"data\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.content a').exists({
        count: 2
      });
      assert.dom(this.element).hasText('Go to downstream pipeline ~sd@1234:main Go to downstream pipeline ~sd@2:prod');
    });
    (0, _qunit.test)('it renders restart link', async function (assert) {
      const data = {
        job: {
          buildId: 1234,
          name: 'batmobile'
        }
      };
      this.set('data', data);
      this.set('confirmStartBuild', () => {});
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "Cp1mOX5W",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-tooltip\",null,[[\"tooltipData\",\"displayRestartButton\",\"confirmStartBuild\"],[[25,[\"data\"]],true,\"confirmStartBuild\"]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.content a').exists({
        count: 3
      });
      assert.dom('a:first-child').hasText('Go to build details');
      assert.dom('a:last-child').hasText('Start pipeline from here');
    });
    (0, _qunit.test)('it should update position and hidden status', async function (assert) {
      this.set('show', true);
      this.set('pos', 'left');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "cJ/VaugE",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"workflow-tooltip\",null,[[\"showTooltip\",\"showTooltipPosition\"],[[25,[\"show\"]],[25,[\"pos\"]]]]],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom('.workflow-tooltip').hasClass('show-tooltip');
      assert.dom('.workflow-tooltip').hasClass('left');
      this.set('show', false);
      this.set('pos', 'center');
      assert.dom('.workflow-tooltip').hasNoClass('show-tooltip');
      assert.dom('.workflow-tooltip').hasNoClass('left');
    });
  });
});
define("screwdriver-ui/tests/integration/helpers/get-step-data-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('helper:get-step-data', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders a value', async function (assert) {
      this.set('buildSteps', [{
        name: 'banana',
        startTime: '1234',
        endTime: '1235',
        code: 128
      }, {
        name: 'monkey',
        startTime: '1236',
        endTime: '1239',
        code: 0
      }]);
      this.set('step', 'banana');
      this.set('field', 'code');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "vV29m+++",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"get-step-data\",[[25,[\"buildSteps\"]],[25,[\"step\"]],[25,[\"field\"]]],null],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).hasText('128');
    });
    (0, _qunit.test)('it fetches an object', async function (assert) {
      this.set('buildSteps', [{
        name: 'banana',
        startTime: '1234',
        endTime: '1235',
        code: 128
      }, {
        name: 'monkey',
        startTime: '1236',
        endTime: '1239',
        code: 0
      }]);
      this.set('field', 'startTime');
      this.set('step', 'monkey');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "wlXDCyPx",
        "block": "{\"symbols\":[\"s\"],\"statements\":[[4,\"with\",[[29,\"get-step-data\",[[25,[\"buildSteps\"]],[25,[\"step\"]]],null]],null,{\"statements\":[[1,[24,1,[\"startTime\"]],false]],\"parameters\":[1]},null]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).hasText('1236');
    });
  });
});
define("screwdriver-ui/tests/integration/helpers/x-duration-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('helper:x-duration', function (hooks) {
    (0, _emberQunit.setupRenderingTest)(hooks);
    (0, _qunit.test)('it renders a duration given two parsable times in HH:mm:ss format', async function (assert) {
      this.set('time1', 1478912844724);
      this.set('time2', 1478912845724);
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YOnrFm2e",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"x-duration\",[[25,[\"time1\"]],[25,[\"time2\"]]],null],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).hasText('00:00:01');
      this.set('time1', '2016-11-04T20:09:41.238Z');
      this.set('time2', '2016-11-04T20:09:44.238Z');
      await (0, _testHelpers.render)(Ember.HTMLBars.template({
        "id": "YOnrFm2e",
        "block": "{\"symbols\":[],\"statements\":[[1,[29,\"x-duration\",[[25,[\"time1\"]],[25,[\"time2\"]]],null],false]],\"hasEval\":false}",
        "meta": {}
      }));
      assert.dom(this.element).hasText('00:00:03');
    });
  });
});
define("screwdriver-ui/tests/lint/app.lint-test", [], function () {
  "use strict";

  QUnit.module('ESLint | app');
  QUnit.test('404/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, '404/route.js should pass ESLint\n\n');
  });
  QUnit.test('app.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'app.js should pass ESLint\n\n');
  });
  QUnit.test('application/adapter.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'application/adapter.js should pass ESLint\n\n');
  });
  QUnit.test('application/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'application/controller.js should pass ESLint\n\n');
  });
  QUnit.test('application/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'application/route.js should pass ESLint\n\n');
  });
  QUnit.test('authenticators/screwdriver-api.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'authenticators/screwdriver-api.js should pass ESLint\n\n');
  });
  QUnit.test('banner/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'banner/service.js should pass ESLint\n\n');
  });
  QUnit.test('breakpoints.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'breakpoints.js should pass ESLint\n\n');
  });
  QUnit.test('build-artifact/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'build-artifact/service.js should pass ESLint\n\n');
  });
  QUnit.test('build-logs/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'build-logs/service.js should pass ESLint\n\n');
  });
  QUnit.test('build/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'build/model.js should pass ESLint\n\n');
  });
  QUnit.test('build/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'build/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('builds/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'builds/route.js should pass ESLint\n\n');
  });
  QUnit.test('cache/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'cache/service.js should pass ESLint\n\n');
  });
  QUnit.test('collection/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'collection/model.js should pass ESLint\n\n');
  });
  QUnit.test('collection/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'collection/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('command/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'command/service.js should pass ESLint\n\n');
  });
  QUnit.test('commands/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/controller.js should pass ESLint\n\n');
  });
  QUnit.test('commands/detail/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/detail/controller.js should pass ESLint\n\n');
  });
  QUnit.test('commands/detail/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/detail/route.js should pass ESLint\n\n');
  });
  QUnit.test('commands/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/index/route.js should pass ESLint\n\n');
  });
  QUnit.test('commands/namespace/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/namespace/route.js should pass ESLint\n\n');
  });
  QUnit.test('commands/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'commands/route.js should pass ESLint\n\n');
  });
  QUnit.test('components/app-header/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/app-header/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/artifact-tree/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/artifact-tree/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/bread-crumbs/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/bread-crumbs/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/build-banner/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/build-banner/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/build-log/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/build-log/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/build-step-collection/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/build-step-collection/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/build-step-item/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/build-step-item/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/chart-c3/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/chart-c3/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/collection-dropdown/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/collection-dropdown/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/collection-modal/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/collection-modal/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/collection-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/collection-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/collections-flyout/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/collections-flyout/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/command-format/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/command-format/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/command-header/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/command-header/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/command-versions/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/command-versions/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/error-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/error-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/home-hero/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/home-hero/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/info-message/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/info-message/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/job-toggle-modal/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/job-toggle-modal/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/loading-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/loading-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/login-button/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/login-button/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/nav-banner/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/nav-banner/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-create-form/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-create-form/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-event-row/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-event-row/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-events-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-events-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-graph-nav/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-graph-nav/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-header/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-header/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-nav/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-nav/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-options/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-options/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-pr-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-pr-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-pr-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-pr-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-secret-settings/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-secret-settings/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-start/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-start/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/pipeline-workflow/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/pipeline-workflow/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/search-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/search-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/secret-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/secret-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/tc-collection-linker/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/tc-collection-linker/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/tc-collection-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/tc-collection-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/template-header/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/template-header/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/template-versions/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/template-versions/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/token-list/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/token-list/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/token-view/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/token-view/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/user-link/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/user-link/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/validator-input/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/validator-input/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/validator-job/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/validator-job/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/validator-pipeline/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/validator-pipeline/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/validator-results/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/validator-results/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/workflow-graph-d3/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/workflow-graph-d3/component.js should pass ESLint\n\n');
  });
  QUnit.test('components/workflow-tooltip/component.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'components/workflow-tooltip/component.js should pass ESLint\n\n');
  });
  QUnit.test('coverage/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'coverage/service.js should pass ESLint\n\n');
  });
  QUnit.test('create/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'create/controller.js should pass ESLint\n\n');
  });
  QUnit.test('create/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'create/route.js should pass ESLint\n\n');
  });
  QUnit.test('dashboard/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'dashboard/index/route.js should pass ESLint\n\n');
  });
  QUnit.test('dashboard/show/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'dashboard/show/controller.js should pass ESLint\n\n');
  });
  QUnit.test('dashboard/show/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'dashboard/show/route.js should pass ESLint\n\n');
  });
  QUnit.test('event-stop/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'event-stop/service.js should pass ESLint\n\n');
  });
  QUnit.test('event/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'event/model.js should pass ESLint\n\n');
  });
  QUnit.test('event/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'event/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/ansi-colorize.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/ansi-colorize.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/get-last-build.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/get-last-build.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/get-step-data.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/get-step-data.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/index-of.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/index-of.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/x-duration.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/x-duration.js should pass ESLint\n\n');
  });
  QUnit.test('home/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'home/route.js should pass ESLint\n\n');
  });
  QUnit.test('instance-initializers/supplementary-config.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'instance-initializers/supplementary-config.js should pass ESLint\n\n');
  });
  QUnit.test('job/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'job/model.js should pass ESLint\n\n');
  });
  QUnit.test('job/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'job/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('login/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'login/controller.js should pass ESLint\n\n');
  });
  QUnit.test('login/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'login/route.js should pass ESLint\n\n');
  });
  QUnit.test('metric/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'metric/model.js should pass ESLint\n\n');
  });
  QUnit.test('mixins/model-reloader.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mixins/model-reloader.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline-startall/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline-startall/service.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline-triggers/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline-triggers/service.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/build/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/build/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/build/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/build/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/build/step/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/build/step/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/child-pipelines/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/child-pipelines/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/child-pipelines/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/child-pipelines/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/events/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/events/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/events/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/events/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/index/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/metrics/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/metrics/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/metrics/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/metrics/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/model.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/options/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/options/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/options/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/options/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/pulls/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/pulls/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/secrets/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/secrets/controller.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/secrets/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/secrets/route.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/secrets/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/secrets/service.js should pass ESLint\n\n');
  });
  QUnit.test('pipeline/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pipeline/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('pr-events/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'pr-events/service.js should pass ESLint\n\n');
  });
  QUnit.test('resolver.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'resolver.js should pass ESLint\n\n');
  });
  QUnit.test('router.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'router.js should pass ESLint\n\n');
  });
  QUnit.test('scm/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'scm/model.js should pass ESLint\n\n');
  });
  QUnit.test('scm/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'scm/service.js should pass ESLint\n\n');
  });
  QUnit.test('search/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'search/controller.js should pass ESLint\n\n');
  });
  QUnit.test('search/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'search/route.js should pass ESLint\n\n');
  });
  QUnit.test('secret/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'secret/model.js should pass ESLint\n\n');
  });
  QUnit.test('secret/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'secret/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('store/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'store/service.js should pass ESLint\n\n');
  });
  QUnit.test('sync/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'sync/service.js should pass ESLint\n\n');
  });
  QUnit.test('template/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'template/service.js should pass ESLint\n\n');
  });
  QUnit.test('templates/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/controller.js should pass ESLint\n\n');
  });
  QUnit.test('templates/detail/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/detail/controller.js should pass ESLint\n\n');
  });
  QUnit.test('templates/detail/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/detail/route.js should pass ESLint\n\n');
  });
  QUnit.test('templates/index/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/index/controller.js should pass ESLint\n\n');
  });
  QUnit.test('templates/index/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/index/route.js should pass ESLint\n\n');
  });
  QUnit.test('templates/namespace/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/namespace/route.js should pass ESLint\n\n');
  });
  QUnit.test('templates/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'templates/route.js should pass ESLint\n\n');
  });
  QUnit.test('token/model.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'token/model.js should pass ESLint\n\n');
  });
  QUnit.test('token/serializer.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'token/serializer.js should pass ESLint\n\n');
  });
  QUnit.test('user-settings/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'user-settings/controller.js should pass ESLint\n\n');
  });
  QUnit.test('user-settings/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'user-settings/route.js should pass ESLint\n\n');
  });
  QUnit.test('user-settings/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'user-settings/service.js should pass ESLint\n\n');
  });
  QUnit.test('utils/build.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/build.js should pass ESLint\n\n64:5 - Use object destructuring. (prefer-destructuring)\n69:7 - Use object destructuring. (prefer-destructuring)');
  });
  QUnit.test('utils/git.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/git.js should pass ESLint\n\n');
  });
  QUnit.test('utils/graph-tools.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/graph-tools.js should pass ESLint\n\n');
  });
  QUnit.test('utils/template.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/template.js should pass ESLint\n\n');
  });
  QUnit.test('utils/time-range.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'utils/time-range.js should pass ESLint\n\n');
  });
  QUnit.test('validator/controller.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'validator/controller.js should pass ESLint\n\n');
  });
  QUnit.test('validator/route.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'validator/route.js should pass ESLint\n\n');
  });
  QUnit.test('validator/service.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'validator/service.js should pass ESLint\n\n');
  });
});
define("screwdriver-ui/tests/lint/templates.template.lint-test", [], function () {
  "use strict";

  QUnit.module('TemplateLint');
  QUnit.test('screwdriver-ui/404/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/404/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/application/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/application/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/commands/detail/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/commands/detail/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/commands/index/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/commands/index/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/commands/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/commands/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/404-display/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/404-display/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/app-header/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/app-header/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/artifact-tree/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/artifact-tree/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/bread-crumbs/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/bread-crumbs/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/build-banner/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/build-banner/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/build-log/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/build-log/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/build-step-collection/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/build-step-collection/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/build-step-item/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/build-step-item/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/collection-dropdown/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/collection-dropdown/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/collection-modal/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/collection-modal/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/collection-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/collection-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/collections-flyout/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/collections-flyout/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/command-format/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/command-format/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/command-header/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/command-header/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/command-versions/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/command-versions/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/error-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/error-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/home-hero/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/home-hero/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/info-message/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/info-message/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/job-toggle-modal/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/job-toggle-modal/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/loading-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/loading-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/login-button/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/login-button/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/nav-banner/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/nav-banner/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-create-form/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-create-form/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-event-row/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-event-row/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-events-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-events-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-graph-nav/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-graph-nav/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-header/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-header/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-nav/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-nav/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-options/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-options/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-pr-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-pr-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-pr-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-pr-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-rootdir/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-rootdir/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-secret-settings/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-secret-settings/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-start/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-start/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/pipeline-workflow/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/pipeline-workflow/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/search-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/search-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/secret-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/secret-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/tc-collection-linker/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/tc-collection-linker/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/tc-collection-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/tc-collection-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/template-header/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/template-header/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/template-versions/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/template-versions/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/token-list/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/token-list/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/token-view/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/token-view/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/user-link/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/user-link/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/validator-input/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/validator-input/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/validator-job/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/validator-job/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/validator-pipeline/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/validator-pipeline/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/validator-results/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/validator-results/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/workflow-graph-d3/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/workflow-graph-d3/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/components/workflow-tooltip/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/components/workflow-tooltip/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/create/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/create/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/dashboard/index/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/dashboard/index/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/dashboard/show/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/dashboard/show/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/home/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/home/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/login/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/login/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/page-not-found/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/page-not-found/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/build/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/build/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/child-pipelines/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/child-pipelines/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/events/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/events/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/metrics/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/metrics/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/options/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/options/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/secrets/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/secrets/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/pipeline/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/pipeline/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/search/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/search/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/templates/detail/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/templates/detail/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/templates/error.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/templates/error.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/templates/index/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/templates/index/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/templates/loading.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/templates/loading.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/templates/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/templates/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/user-settings/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/user-settings/template.hbs should pass TemplateLint.\n\n');
  });
  QUnit.test('screwdriver-ui/validator/template.hbs', function (assert) {
    assert.expect(1);
    assert.ok(true, 'screwdriver-ui/validator/template.hbs should pass TemplateLint.\n\n');
  });
});
define("screwdriver-ui/tests/lint/tests.lint-test", [], function () {
  "use strict";

  QUnit.module('ESLint | tests');
  QUnit.test('acceptance/create-page-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/create-page-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/dashboards-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/dashboards-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/metrics-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/metrics-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/pipeline-builds-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/pipeline-builds-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/pipeline-childPipelines-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/pipeline-childPipelines-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/pipeline-options-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/pipeline-options-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/pipeline-pr-chain-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/pipeline-pr-chain-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/search-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/search-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/secrets-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/secrets-test.js should pass ESLint\n\n');
  });
  QUnit.test('acceptance/tokens-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'acceptance/tokens-test.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/inject-scm.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/inject-scm.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/inject-session.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/inject-session.js should pass ESLint\n\n');
  });
  QUnit.test('helpers/responsive.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'helpers/responsive.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/app-header/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/app-header/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/artifact-tree/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/artifact-tree/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/bread-crumbs/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/bread-crumbs/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/build-banner/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/build-banner/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/build-log/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/build-log/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/build-step-collection/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/build-step-collection/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/build-step-item/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/build-step-item/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/chart-c3/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/chart-c3/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/collection-dropdown/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/collection-dropdown/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/collection-modal/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/collection-modal/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/collection-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/collection-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/collections-flyout/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/collections-flyout/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/command-format/componenet-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/command-format/componenet-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/command-header/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/command-header/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/command-versions/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/command-versions/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/error-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/error-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/home-hero/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/home-hero/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/info-message/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/info-message/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/job-toggle-modal/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/job-toggle-modal/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/loading-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/loading-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/login-button/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/login-button/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/nav-banner/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/nav-banner/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-create-form/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-create-form/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-event-row/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-event-row/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-events-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-events-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-graph-nav/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-graph-nav/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-header/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-header/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-nav/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-nav/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-options/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-options/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-pr-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-pr-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-pr-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-pr-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-rootdir/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-rootdir/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-secret-settings/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-secret-settings/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-start/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-start/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/pipeline-workflow/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/pipeline-workflow/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/search-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/search-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/secret-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/secret-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/tc-collection-linker/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/tc-collection-linker/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/tc-collection-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/tc-collection-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/template-header/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/template-header/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/template-versions/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/template-versions/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/token-list/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/token-list/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/token-view/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/token-view/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/user-link/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/user-link/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/validator-input/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/validator-input/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/validator-job/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/validator-job/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/validator-pipeline/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/validator-pipeline/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/validator-results/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/validator-results/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/workflow-graph-d3/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/workflow-graph-d3/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/components/workflow-tooltip/component-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/components/workflow-tooltip/component-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/helpers/get-step-data-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/helpers/get-step-data-test.js should pass ESLint\n\n');
  });
  QUnit.test('integration/helpers/x-duration-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'integration/helpers/x-duration-test.js should pass ESLint\n\n');
  });
  QUnit.test('mock/builds.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/builds.js should pass ESLint\n\n');
  });
  QUnit.test('mock/events.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/events.js should pass ESLint\n\n');
  });
  QUnit.test('mock/jobs.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/jobs.js should pass ESLint\n\n');
  });
  QUnit.test('mock/metrics.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/metrics.js should pass ESLint\n\n');
  });
  QUnit.test('mock/pipeline.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/pipeline.js should pass ESLint\n\n');
  });
  QUnit.test('mock/workflow-graph.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'mock/workflow-graph.js should pass ESLint\n\n');
  });
  QUnit.test('test-helper.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'test-helper.js should pass ESLint\n\n');
  });
  QUnit.test('unit/404/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/404/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/application/adapter-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/application/adapter-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/application/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/application/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/application/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/application/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/banner/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/banner/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/build-artifact/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/build-artifact/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/build-logs/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/build-logs/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/build/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/build/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/build/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/build/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/builds/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/builds/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/cache/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/cache/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/collection/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/collection/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/collection/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/collection/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/command/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/command/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/commands/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/commands/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/commands/detail/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/commands/detail/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/commands/detail/router-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/commands/detail/router-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/commands/index/router-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/commands/index/router-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/commands/router-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/commands/router-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/coverage/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/coverage/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/create/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/create/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/create/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/create/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/dashboard/index/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/dashboard/index/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/dashboard/show/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/dashboard/show/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/dashboard/show/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/dashboard/show/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/event-stop/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/event-stop/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/event/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/event/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/helpers/ansi-colorize-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/helpers/ansi-colorize-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/helpers/get-last-build-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/helpers/get-last-build-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/helpers/index-of-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/helpers/index-of-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/home/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/home/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/instance-initializers/supplementary-config-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/instance-initializers/supplementary-config-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/job/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/job/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/job/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/job/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/login/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/login/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/login/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/login/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/metric/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/metric/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/mixins/model-reloader-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/mixins/model-reloader-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline-startall/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline-startall/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline-triggers/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline-triggers/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/build/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/build/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/build/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/build/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/build/step/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/build/step/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/events/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/events/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/events/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/events/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/index/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/index/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/metrics/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/metrics/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/metrics/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/metrics/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/options/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/options/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/options/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/options/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/pulls/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/pulls/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/secrets/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/secrets/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/secrets/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/secrets/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pipeline/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pipeline/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/pr-events/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/pr-events/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/search/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/search/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/search/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/search/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/secret/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/secret/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/secret/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/secret/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/store/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/store/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/sync/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/sync/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/template/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/template/service-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/templates/detail/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/templates/detail/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/templates/detail/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/templates/detail/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/templates/index/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/templates/index/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/templates/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/templates/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/token/model-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/token/model-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/token/serializer-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/token/serializer-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/utils/build-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/utils/build-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/utils/git-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/utils/git-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/utils/graph-tools-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/utils/graph-tools-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/utils/template-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/utils/template-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/utils/time-range-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/utils/time-range-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/validator/controller-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/validator/controller-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/validator/route-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/validator/route-test.js should pass ESLint\n\n');
  });
  QUnit.test('unit/validator/service-test.js', function (assert) {
    assert.expect(1);
    assert.ok(true, 'unit/validator/service-test.js should pass ESLint\n\n');
  });
});
define("screwdriver-ui/tests/mock/builds", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const build = {
    id: '1234',
    jobId: '1',
    number: 1474649580274,
    container: 'node:6',
    cause: 'Started by user batman',
    sha: 'c96f36886e084d18bd068b8156d095cd9b31e1d6',
    createTime: '2016-09-23T16:53:00.274Z',
    startTime: '2016-09-23T16:53:08.601Z',
    endTime: '2016-09-23T16:58:47.355Z',
    meta: {},
    steps: [{
      startTime: '2016-09-23T16:53:07.497654442Z',
      name: 'sd-setup',
      code: 0,
      endTime: '2016-09-23T16:53:12.46806858Z'
    }, {
      startTime: '2016-09-23T16:53:12.902784483Z',
      name: 'install',
      code: 137,
      endTime: '2016-09-23T16:58:46.924844475Z'
    }, {
      name: 'bower'
    }, {
      name: 'test'
    }],
    status: 'FAILURE'
  };
  const shas = ['abcd1234567890', 'bcd1234567890a', 'cd1234567890ab', 'd1234567890abc', '1234567890abcd'];

  var _default = eventId => {
    const builds = [];
    shas.forEach(sha => {
      const b = Ember.copy(build, true);
      const config = {
        id: Math.floor(Math.random() * 99999999999),
        eventId,
        sha,
        number: Date.now(),
        status: ['SUCCESS', 'FAILURE', 'RUNNING'][Math.floor(Math.random() * 2)]
      };
      Ember.assign(b, config);
      builds.push(b);
    });
    return builds;
  };

  _exports.default = _default;
});
define("screwdriver-ui/tests/mock/events", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const events = [{
    id: '2',
    causeMessage: 'Merged by batman',
    commit: {
      message: 'Merge pull request #2 from batcave/batmobile',
      author: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    },
    startFrom: '~commit',
    pipelineId: '12345',
    sha: 'abcdef1029384',
    type: 'pipeline',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }, {
    id: '3',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix bug',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'http://example.com/u/robin/avatar',
        url: 'http://example.com/u/robin'
      },
      url: 'http://example.com/batcave/batmobile/commit/1029384bbb'
    },
    createTime: '2016-11-05T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'http://example.com/u/robin/avatar',
      url: 'http://example.com/u/robin'
    },
    startFrom: '~pr',
    pr: {
      url: 'http://example.com/batcave/batmobile/pulls/42'
    },
    pipelineId: '12345',
    type: 'pr',
    prNum: 42,
    sha: '1029384bbb',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }, {
    id: '4',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix docs',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'http://example.com/u/robin/avatar',
        url: 'http://example.com/u/robin'
      },
      url: 'http://example.com/batcave/batmobile/commit/1030384bbb'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'http://example.com/u/robin/avatar',
      url: 'http://example.com/u/robin'
    },
    startFrom: '~pr',
    pr: {
      url: 'http://example.com/batcave/batmobile/pulls/43'
    },
    pipelineId: '12345',
    sha: '1030384bbb',
    type: 'pr',
    prNum: 43,
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }];

  var _default = workflowGraph => events.map(e => Ember.assign(Ember.copy(e, true), {
    workflowGraph
  }));

  _exports.default = _default;
});
define("screwdriver-ui/tests/mock/jobs", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.metricJobs = metricJobs;
  _exports.default = void 0;

  var _default = () => Ember.copy([{
    id: '12345',
    name: 'main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }, {
    id: '12346',
    name: 'publish',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }, {
    id: '12347',
    name: 'PR-42:main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }, {
    id: '12348',
    name: 'PR-42:publish',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }, {
    id: '12349',
    name: 'PR-43:main',
    pipelineId: '4',
    state: 'ENABLED',
    archived: false
  }], true);
  /**
   * Return jobs mock for use with metrics
   *
   * @export
   * @returns
   */


  _exports.default = _default;

  function metricJobs() {
    return Ember.copy([{
      id: 159,
      name: 'prod',
      pipelineId: 4,
      state: 'ENABLED',
      archived: false
    }, {
      id: 158,
      name: 'beta',
      pipelineId: 4,
      state: 'ENABLED',
      archived: false
    }, {
      id: 157,
      name: 'publish',
      pipelineId: 4,
      state: 'ENABLED',
      archived: false
    }, {
      id: 156,
      name: 'main',
      pipelineId: 4,
      state: 'ENABLED',
      archived: false
    }], true);
  }
});
define("screwdriver-ui/tests/mock/metrics", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.model = model;
  _exports.default = void 0;

  var _default = () => Ember.copy([{
    id: 71767,
    createTime: '2019-03-12T01:09:55.973Z',
    causeMessage: 'Merged by DekusDenial',
    sha: '3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
    queuedTime: 11,
    imagePullTime: 21,
    duration: 1144,
    status: 'SUCCESS',
    builds: [{
      id: 99335,
      jobId: 158,
      eventId: 71767,
      createTime: '2019-03-12T01:24:10.173Z',
      startTime: '2019-03-12T01:24:19.388Z',
      endTime: '2019-03-12T01:29:11.231Z',
      duration: 292,
      status: 'SUCCESS',
      queuedTime: 2,
      imagePullTime: 8
    }, {
      id: 99334,
      jobId: 157,
      eventId: 71767,
      createTime: '2019-03-12T01:18:28.063Z',
      startTime: '2019-03-12T01:18:39.806Z',
      endTime: '2019-03-12T01:24:04.219Z',
      duration: 324,
      status: 'SUCCESS',
      queuedTime: 4,
      imagePullTime: 7
    }, {
      id: 99331,
      jobId: 156,
      eventId: 71767,
      createTime: '2019-03-12T01:09:56.354Z',
      startTime: '2019-03-12T01:10:07.408Z',
      endTime: '2019-03-12T01:18:26.479Z',
      duration: 499,
      status: 'SUCCESS',
      queuedTime: 5,
      imagePullTime: 6
    }]
  }, {
    id: 71900,
    createTime: '2019-03-12T12:29:29.922Z',
    causeMessage: 'Merged by DekusDenial',
    sha: 'e6c90056bb11e52d94e74dcc9eae7d17ce8eb290',
    queuedTime: 14,
    imagePullTime: 20,
    duration: 1002,
    status: 'SUCCESS',
    builds: [{
      id: 99596,
      jobId: 158,
      eventId: 71900,
      createTime: '2019-03-12T12:43:15.229Z',
      startTime: '2019-03-12T12:43:27.707Z',
      endTime: '2019-03-12T12:46:23.926Z',
      duration: 176,
      status: 'SUCCESS',
      queuedTime: 5,
      imagePullTime: 7
    }, {
      id: 99595,
      jobId: 157,
      eventId: 71900,
      createTime: '2019-03-12T12:37:45.031Z',
      startTime: '2019-03-12T12:37:56.605Z',
      endTime: '2019-03-12T12:43:13.990Z',
      duration: 317,
      status: 'SUCCESS',
      queuedTime: 5,
      imagePullTime: 6
    }, {
      id: 99594,
      jobId: 156,
      eventId: 71900,
      createTime: '2019-03-12T12:29:30.300Z',
      startTime: '2019-03-12T12:29:42.193Z',
      endTime: '2019-03-12T12:37:43.721Z',
      duration: 482,
      status: 'SUCCESS',
      queuedTime: 4,
      imagePullTime: 7
    }]
  }, {
    id: 72148,
    createTime: '2019-03-13T22:23:18.712Z',
    causeMessage: 'Merged by DekusDenial',
    sha: '91f45d077bacd52d13a7d5f76f2717f9fbec61b4',
    queuedTime: 15,
    imagePullTime: 29,
    duration: 1073,
    status: 'SUCCESS',
    builds: [{
      id: 100115,
      jobId: 159,
      eventId: 72148,
      createTime: '2019-03-13T22:40:23.335Z',
      startTime: '2019-03-13T22:40:31.848Z',
      endTime: '2019-03-13T22:41:23.210Z',
      duration: 51,
      status: 'SUCCESS',
      queuedTime: 1,
      imagePullTime: 7
    }, {
      id: 100114,
      jobId: 158,
      eventId: 72148,
      createTime: '2019-03-13T22:37:06.616Z',
      startTime: '2019-03-13T22:37:17.501Z',
      endTime: '2019-03-13T22:40:21.885Z',
      duration: 184,
      status: 'SUCCESS',
      queuedTime: 4,
      imagePullTime: 7
    }, {
      id: 100113,
      jobId: 157,
      eventId: 72148,
      createTime: '2019-03-13T22:31:33.160Z',
      startTime: '2019-03-13T22:31:46.869Z',
      endTime: '2019-03-13T22:37:05.444Z',
      duration: 319,
      status: 'SUCCESS',
      queuedTime: 6,
      imagePullTime: 8
    }, {
      id: 100109,
      jobId: 156,
      eventId: 72148,
      createTime: '2019-03-13T22:23:19.049Z',
      startTime: '2019-03-13T22:23:30.100Z',
      endTime: '2019-03-13T22:31:31.856Z',
      duration: 482,
      status: 'SUCCESS',
      queuedTime: 4,
      imagePullTime: 7
    }]
  }, {
    id: 72817,
    createTime: '2019-03-15T21:07:33.358Z',
    causeMessage: 'Merged by jithin1987',
    sha: '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c',
    queuedTime: 27,
    imagePullTime: 30,
    duration: 2070,
    status: 'SUCCESS',
    builds: [{
      id: 101329,
      jobId: 159,
      eventId: 72817,
      createTime: '2019-03-15T21:41:08.641Z',
      startTime: '2019-03-15T21:41:22.231Z',
      endTime: '2019-03-15T21:42:13.264Z',
      duration: 51,
      status: 'SUCCESS',
      queuedTime: 5,
      imagePullTime: 8
    }, {
      id: 101320,
      jobId: 158,
      eventId: 72817,
      createTime: '2019-03-15T21:21:40.972Z',
      startTime: '2019-03-15T21:22:02.303Z',
      endTime: '2019-03-15T21:41:07.039Z',
      duration: 1145,
      status: 'SUCCESS',
      queuedTime: 14,
      imagePullTime: 7
    }, {
      id: 101314,
      jobId: 157,
      eventId: 72817,
      createTime: '2019-03-15T21:16:13.163Z',
      startTime: '2019-03-15T21:16:26.827Z',
      endTime: '2019-03-15T21:21:40.019Z',
      duration: 313,
      status: 'SUCCESS',
      queuedTime: 6,
      imagePullTime: 8
    }, {
      id: 101306,
      jobId: 156,
      eventId: 72817,
      createTime: '2019-03-15T21:07:33.723Z',
      startTime: '2019-03-15T21:07:43.185Z',
      endTime: '2019-03-15T21:16:11.987Z',
      duration: 509,
      status: 'SUCCESS',
      queuedTime: 2,
      imagePullTime: 7
    }]
  }], true);
  /**
   * Return mock model for metrics
   *
   * @export
   * @returns
   */


  _exports.default = _default;

  function model() {
    return Ember.copy({
      startTime: '2019-03-25T01:00',
      endTime: '2019-03-26T17:01:19',
      successOnly: false,
      jobId: '156',
      metrics: {
        events: {
          queuedTime: [0.18333333333333332, 0.23333333333333334, 0.25, 0.45],
          imagePullTime: [0.35, 0.3333333333333333, 0.48333333333333334, 0.5],
          duration: [19.066666666666666, 16.7, 17.883333333333333, 34.5],
          total: [19.6, 17.266666666666666, 18.616666666666667, 35.45],
          sha: ['3deb58c4059220c9e5ae92f3ccd1609aa36e47e7', 'e6c90056bb11e52d94e74dcc9eae7d17ce8eb290', '91f45d077bacd52d13a7d5f76f2717f9fbec61b4', '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c'],
          status: ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS'],
          createTime: ['2019-03-12T01:09:55.973Z', '2019-03-12T12:29:29.922Z', '2019-03-13T22:23:18.712Z', '2019-03-15T21:07:33.358Z']
        },
        builds: [{
          beta: 4.866666666666666,
          publish: 5.4,
          main: 8.316666666666666
        }, {
          beta: 2.933333333333333,
          publish: 5.283333333333333,
          main: 8.033333333333333
        }, {
          prod: 0.85,
          beta: 3.066666666666667,
          publish: 5.316666666666666,
          main: 8.033333333333333
        }, {
          prod: 0.85,
          beta: 19.083333333333332,
          publish: 5.216666666666667,
          main: 8.483333333333333
        }],
        jobMap: {
          main: '156',
          publish: '157',
          beta: '158',
          prod: '159'
        },
        steps: {
          sha: ['e6c90056bb11e52d94e74dcc9eae7d17ce8eb290', '91f45d077bacd52d13a7d5f76f2717f9fbec61b4', '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c'],
          status: ['SUCCESS', 'SUCCESS', 'SUCCESS'],
          createTime: ['2019-03-12T12:29:29.922Z', '2019-03-13T22:23:18.712Z', '2019-03-15T21:07:33.358Z'],
          data: [{
            'sd-setup-init': 0.6333333333333333,
            'sd-setup-launcher': 0,
            'sd-setup-scm': 0.03333333333333333,
            'sd-setup-screwdriver-cache-bookend': 0.18333333333333332,
            install: 1.2,
            'install-browsers': 0.75,
            test: 4.6,
            'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
            'sd-teardown-screwdriver-artifact-bookend': 0.016666666666666666,
            'sd-teardown-screwdriver-cache-bookend': 0.2
          }, {
            'sd-setup-init': 0.25,
            'sd-setup-launcher': 0,
            'sd-setup-scm': 0.03333333333333333,
            'sd-setup-screwdriver-cache-bookend': 0.2,
            install: 1.1666666666666667,
            'install-browsers': 0.7333333333333333,
            test: 4.583333333333333,
            'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
            'sd-teardown-screwdriver-artifact-bookend': 0.03333333333333333,
            'sd-teardown-screwdriver-cache-bookend': 0.21666666666666667
          }, {
            'sd-setup-init': 0.2,
            'sd-setup-launcher': 0,
            'sd-setup-scm': 0.016666666666666666,
            'sd-setup-screwdriver-cache-bookend': 0.18333333333333332,
            install: 1.1666666666666667,
            'install-browsers': 0.75,
            test: 4.7,
            'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
            'sd-teardown-screwdriver-artifact-bookend': 0.016666666666666666,
            'sd-teardown-screwdriver-cache-bookend': 0.18333333333333332
          }]
        },
        stepGroup: ['install', 'install-browsers', 'sd-setup-init', 'sd-setup-launcher', 'sd-setup-scm', 'sd-setup-screwdriver-cache-bookend', 'sd-teardown-screwdriver-artifact-bookend', 'sd-teardown-screwdriver-cache-bookend', 'sd-teardown-screwdriver-coverage-bookend', 'test'],
        measures: {
          total: 4,
          passed: 4,
          failed: 0,
          avgs: {
            queuedTime: '17 seconds',
            imagePullTime: '25 seconds',
            duration: '22 minutes, 2 seconds'
          }
        }
      }
    }, true);
  }
});
define("screwdriver-ui/tests/mock/pipeline", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  const pipeline = {
    id: '4',
    scmUrl: 'git@github.com:foo/bar.git#master',
    scmRepo: {
      name: 'foo/bar',
      branch: 'master',
      url: 'https://github.com/foo/bar'
    },
    createTime: '2016-09-15T23:12:23.760Z',
    admins: {
      batman: true
    },
    workflowGraph: {
      nodes: [],
      edges: []
    }
  };

  var _default = workflowGraph => Ember.assign(Ember.copy(pipeline, true), {
    workflowGraph
  });

  _exports.default = _default;
});
define("screwdriver-ui/tests/mock/workflow-graph", ["exports"], function (_exports) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;

  var _default = () => Ember.copy({
    nodes: [{
      name: '~pr'
    }, {
      name: '~commit'
    }, {
      id: 12345,
      name: 'main'
    }, {
      is: 123456,
      name: 'publish'
    }],
    edges: [{
      src: '~pr',
      dest: 'main'
    }, {
      src: '~commit',
      dest: 'main'
    }, {
      src: 'main',
      dest: 'publish'
    }]
  }, true);

  _exports.default = _default;
});
define("screwdriver-ui/tests/test-helper", ["@ember/test-helpers", "ember-qunit", "screwdriver-ui/app", "screwdriver-ui/config/environment"], function (_testHelpers, _emberQunit, _app, _environment) {
  "use strict";

  (0, _testHelpers.setApplication)(_app.default.create(_environment.default.APP));
  (0, _emberQunit.start)();
});
define("screwdriver-ui/tests/unit/404/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | 404', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:404');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/application/adapter-test", ["qunit", "ember-qunit", "pretender", "ember-data"], function (_qunit, _emberQunit, _pretender, _emberData) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Adapter | application', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      assert.ok(adapter);
    });
    (0, _qunit.test)('it uses cors for ajax', function (assert) {
      assert.expect(3);
      server.get('https://sd.cd/fake', () => [200, {
        'content-type': 'application/json'
      }, '{"foo": "bar"}']);

      server.handledRequest = function (verb, path, request) {
        assert.equal(verb, 'GET');
        assert.equal(request.withCredentials, true);
      };

      let adapter = this.owner.lookup('adapter:application');
      return adapter.ajax('https://sd.cd/fake', 'GET').then(response => {
        assert.deepEqual(response, {
          foo: 'bar'
        });
      });
    });
    (0, _qunit.test)('it wraps non-array payload with model name', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/builds/12345'
      };
      const payload = adapter.handleResponse(200, {}, {
        id: 1234
      }, requestData);
      assert.deepEqual(payload, {
        build: {
          id: 1234
        }
      });
    });
    (0, _qunit.test)('it wraps array payload with model name', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/builds'
      };
      const payload = adapter.handleResponse(200, {}, [{
        id: 1234
      }], requestData);
      assert.deepEqual(payload, {
        builds: [{
          id: 1234
        }]
      });
    });
    (0, _qunit.test)('it adds links to pipelines', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234324'
      };
      const payload = adapter.handleResponse(200, {}, {
        id: 1234
      }, requestData);
      assert.deepEqual(payload, {
        pipeline: {
          id: 1234,
          links: {
            jobs: 'jobs',
            secrets: 'secrets',
            events: 'events',
            tokens: 'tokens',
            metrics: 'metrics'
          }
        }
      });
    });
    (0, _qunit.test)('it adds links to jobs', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234/jobs'
      };
      const payload = adapter.handleResponse(200, {}, [{
        id: 1234
      }], requestData);
      assert.deepEqual(payload, {
        jobs: [{
          id: 1234,
          links: {
            builds: 'builds?count=10&page=1',
            metrics: 'metrics'
          }
        }]
      });
    });
    (0, _qunit.test)('it adds links to jobs', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234/jobs'
      };
      const payload = adapter.handleResponse(200, {}, [], requestData);
      assert.deepEqual(payload, {
        jobs: []
      });
    });
    (0, _qunit.test)('it wraps errors', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234/jobs'
      };
      const payload = adapter.handleResponse(404, {}, {
        error: 'bananas'
      }, requestData);
      assert.ok(payload instanceof _emberData.default.AdapterError);
    });
    (0, _qunit.test)('it wraps error objects', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234/jobs'
      };
      const payload = adapter.handleResponse(404, {}, {
        error: {
          statusCode: 400,
          error: 'unfortunate',
          message: 'a series of unfortunate events'
        }
      }, requestData);
      assert.ok(payload instanceof _emberData.default.AdapterError);
    });
    (0, _qunit.test)('it takes care of empty payload', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const requestData = {
        url: 'http://localhost:8080/v4/pipelines/1234'
      };
      const payload = adapter.handleResponse(204, {}, null, requestData);
      assert.deepEqual(payload, {});
    });
    (0, _qunit.test)('it returns pipelinetoken endpoint when model is token with pipelineId', function (assert) {
      let adapter = this.owner.lookup('adapter:application');
      const modelname = 'token';
      const snapshot = {
        adapterOptions: {
          pipelineId: '1'
        }
      };
      const id = '123';
      const baseUrl = 'http://localhost:8080/v4/pipelines/1/tokens';
      const urlForFindAll = adapter.urlForFindAll(modelname, snapshot);
      const urlForCreateRecord = adapter.urlForCreateRecord(modelname, snapshot);
      const urlForUpdateRecord = adapter.urlForUpdateRecord(id, modelname, snapshot);
      const urlForDeleteRecord = adapter.urlForDeleteRecord(id, modelname, snapshot);
      assert.deepEqual(urlForFindAll, baseUrl);
      assert.deepEqual(urlForCreateRecord, baseUrl);
      assert.deepEqual(urlForUpdateRecord, "".concat(baseUrl, "/").concat(id));
      assert.deepEqual(urlForDeleteRecord, "".concat(baseUrl, "/").concat(id));
    });
    (0, _qunit.test)('it returns endpoint for metric and event given pipeline id', function (assert) {
      const adapter = this.owner.lookup('adapter:application');
      const metricsUrl = 'http://localhost:8080/v4/pipelines/1/metrics';
      const eventsUrl = 'http://localhost:8080/v4/pipelines/1/events';
      const jobMetricsUrl = 'http://localhost:8080/v4/jobs/1/metrics';
      assert.equal(adapter.urlForQuery({
        pipelineId: 1
      }, 'metric'), metricsUrl);
      assert.equal(adapter.urlForQuery({
        pipelineId: 1
      }, 'event'), eventsUrl);
      assert.equal(adapter.urlForQuery({
        jobId: 1
      }, 'metric'), jobMetricsUrl);
    });
  });
});
define("screwdriver-ui/tests/unit/application/controller-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Controller | application', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      Ember.run(() => {
        // Need this to mock any core services
        // https://github.com/emberjs/ember-qunit/issues/325
        this.owner.unregister('service:session');
      });
    });
    (0, _qunit.test)('it exists', function (assert) {
      const controller = this.owner.lookup('controller:application');
      assert.ok(controller);
    });
    (0, _qunit.test)('it calls session.invalidateSession', function (assert) {
      assert.expect(3);
      const sessionServiceMock = Ember.Service.extend({
        data: {},

        invalidate() {
          assert.ok(true);
        }

      });
      this.owner.register('service:session', sessionServiceMock);
      const controller = this.owner.lookup('controller:application');
      assert.equal(controller.get('session').get('data.sessionChanged'), undefined);
      controller.send('invalidateSession');
      assert.equal(controller.get('session').get('data.sessionChanged'), false);
    });
    (0, _qunit.test)('it calls session.authenticate', function (assert) {
      assert.expect(4);
      const controller = this.owner.lookup('controller:application');
      const sessionServiceMock = Ember.Service.extend({
        data: {
          authenticated: {}
        },

        authenticate() {
          assert.ok(true);
          return {
            then: cb => cb()
          };
        }

      });
      this.owner.register('service:session', sessionServiceMock);
      controller.send('authenticate');
      assert.equal(controller.get('session').get('data.sessionChanged'), undefined);
      controller.get('session').set('data.authenticated.scmContext', 'new');
      controller.send('authenticate');
      assert.equal(controller.get('session').get('data.sessionChanged'), true);
    });
    (0, _qunit.test)('it calls search in controller', function (assert) {
      const controller = this.owner.lookup('controller:application');

      controller.transitionToRoute = (path, params) => {
        assert.equal(path, 'search');
        assert.deepEqual(params, {
          queryParams: {
            query: 'myquery'
          }
        });
      };

      controller.send('search', 'myquery');
    });
  });
});
define("screwdriver-ui/tests/unit/application/route-test", ["ember-qunit", "qunit", "ember-sinon-qunit/test-support/test", "screwdriver-ui/tests/helpers/inject-scm"], function (_emberQunit, _qunit, _test, _injectScm) {
  "use strict";

  (0, _qunit.module)('Unit | Route | application', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _test.default)('it exists', function (assert) {
      const route = this.owner.lookup('route:application');
      assert.ok(route);
    });
    (0, _test.default)('it calculates title', function (assert) {
      const route = this.owner.lookup('route:application');
      assert.equal(route.title(), 'screwdriver.cd');
      assert.equal(route.title([]), 'screwdriver.cd');
      assert.equal(route.title(['a', 'b', 'c']), 'a > b > c > screwdriver.cd');
    });
    (0, _test.default)('it should reload on sessionInvalidated', function (assert) {
      const route = this.owner.lookup('route:application');
      const reloadStub = this.stub(route, 'reloadPage');
      route.sessionInvalidated();
      assert.ok(reloadStub.calledOnce, 'reloadPage was not called');
    });
    (0, _test.default)('it should clear store and reload page on session change', function (assert) {
      const route = this.owner.lookup('route:application');
      const session = this.owner.lookup('service:session');
      const reloadStub = this.stub(route, 'reloadPage');
      session.set('data.sessionChanged', true);
      assert.ok(reloadStub.calledOnce, 'reloadPage was not called');
    });
    (0, _test.default)('it should not clear store and reload page if no session change', function (assert) {
      const route = this.owner.lookup('route:application');
      const session = this.owner.lookup('service:session');
      const reloadStub = this.stub(route, 'reloadPage');
      session.set('data.sessionChanged', false);
      assert.notOk(reloadStub.calledOnce, 'reloadPage was called');
    });
    (0, _test.default)('it shoud return model of scms', function (assert) {
      (0, _injectScm.default)(this, false);
      const route = this.owner.lookup('route:application');
      return route.model().then(scms => {
        assert.equal(scms[0].context, 'github:github.com');
        assert.equal(scms[0].displayName, 'github.com');
        assert.equal(scms[0].iconType, 'github');
        assert.equal(scms[0].isSignedIn, true);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/banner/service-test", ["pretender", "qunit", "ember-qunit"], function (_pretender, _qunit, _emberQunit) {
  "use strict";

  const actualMessage = 'shutdown imminent';
  let server;

  const getBanners = () => {
    server.get('http://localhost:8080/v4/banners', () => [200, {
      'Content-Type': 'application/json'
    }, JSON.stringify([{
      id: 1,
      isActive: true,
      message: actualMessage
    }])]);
  };

  (0, _qunit.module)('Unit | Service | banner', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:banner');
      assert.ok(service);
    });
    (0, _qunit.test)('it fetches active banners', function (assert) {
      assert.expect(1);
      getBanners();
      const service = this.owner.lookup('service:banner');
      const b = service.fetchBanners();
      b.then(banners => {
        assert.equal(banners[0].message, actualMessage);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/build-artifact/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;
  const manifest = ".\n./test.txt\n./coverage\n./coverage/coverage.json";
  const buildId = 1;
  const parsedManifest = [{
    text: 'coverage',
    type: 'directory',
    children: [{
      text: 'coverage.json',
      type: 'file',
      a_attr: {
        href: "http://localhost:8080/v4/builds/".concat(buildId, "/artifacts/coverage/coverage.json")
      }
    }]
  }, {
    text: 'test.txt',
    type: 'file',
    a_attr: {
      href: "http://localhost:8080/v4/builds/".concat(buildId, "/artifacts/test.txt")
    }
  }];

  const getManifest = () => {
    server.get("http://localhost:8081/v1/builds/".concat(buildId, "/ARTIFACTS/manifest.txt"), () => [200, {
      'Content-Type': 'text/plain'
    }, manifest]);
  };

  const sessionServiceMock = Ember.Service.extend({
    isAuthenticated: false,
    data: {
      authenticated: {
        token: 'banana'
      }
    }
  });
  (0, _qunit.module)('Unit | Service | build artifact', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:session'],

    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionServiceMock);
      this.session = this.owner.lookup('service:session');
      this.session.set('isAuthenticated', false);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:build-artifact');
      assert.ok(service);
    });
    (0, _qunit.test)('it rejects if the user is not authenticated', function (assert) {
      assert.expect(2);
      const service = this.owner.lookup('service:build-artifact');
      const p = service.fetchManifest(buildId);
      p.catch(e => {
        assert.ok(e instanceof Error, e);
        assert.equal('User is not authenticated', e.message);
      });
    });
    (0, _qunit.test)('it makes a call to get artifact manifest successfully', function (assert) {
      assert.expect(2);
      this.session.set('isAuthenticated', true);
      getManifest();
      const service = this.owner.lookup('service:build-artifact');
      const p = service.fetchManifest(buildId);
      p.then(data => {
        const [request] = server.handledRequests;
        assert.equal(request.url, "http://localhost:8081/v1/builds/".concat(buildId, "/ARTIFACTS/manifest.txt"));
        assert.deepEqual(data, parsedManifest);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/build-logs/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;
  const now = Date.now();

  const noMoreLogs = () => {
    server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [200, {
      'Content-Type': 'application/json',
      'x-more-data': false
    }, JSON.stringify([{
      t: now,
      n: 0,
      m: 'hello, world'
    }])]);
  };

  const moreLogs = () => {
    server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [200, {
      'Content-Type': 'application/json',
      'x-more-data': true
    }, JSON.stringify([{
      t: now,
      n: 0,
      m: 'hello, world'
    }])]);
  };

  const noNewLogs = () => {
    server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [200, {
      'Content-Type': 'application/json',
      'x-more-data': true
    }, '[]']);
  };

  const badLogs = () => {
    server.get('http://localhost:8080/v4/builds/1/steps/banana/logs/', () => [404, {
      'Content-Type': 'application/json'
    }, '']);
  };

  const sessionServiceMock = Ember.Service.extend({
    isAuthenticated: true,
    data: {
      authenticated: {
        token: 'banana'
      }
    }
  });
  const serviceConfig = {
    buildId: '1',
    stepName: 'banana',
    started: true
  };
  (0, _qunit.module)('Unit | Service | build logs', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:foo']

    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionServiceMock);
      this.session = this.owner.lookup('service:session');
      this.session.set('isAuthenticated', true);
      this.owner.lookup('service:build-logs').resetCache();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:build-logs');
      assert.ok(service);
    });
    (0, _qunit.test)('it rejects if the user is not authenticated', function (assert) {
      assert.expect(2);
      noMoreLogs();
      this.session.set('isAuthenticated', false);
      const service = this.owner.lookup('service:build-logs');
      const p = service.fetchLogs(serviceConfig);
      p.catch(e => {
        assert.ok(e instanceof Error, e);
        assert.equal('User is not authenticated', e.message);
      });
    });
    (0, _qunit.test)('it makes a call to logs api and logs return with no remaining', async function (assert) {
      assert.expect(4);
      noMoreLogs();
      const service = this.owner.lookup('service:build-logs');
      const {
        lines,
        done
      } = await service.fetchLogs(serviceConfig);
      assert.ok(done);
      assert.equal(lines.length, 1);
      assert.equal(lines[0].m, 'hello, world');
      const [request] = server.handledRequests;
      assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
    });
    (0, _qunit.test)('it makes a call to logs api and logs return with more remaining', async function (assert) {
      assert.expect(4);
      moreLogs();
      const service = this.owner.lookup('service:build-logs');
      const {
        lines,
        done
      } = await service.fetchLogs({
        logNumber: 50,
        ...serviceConfig
      });
      assert.notOk(done);
      assert.equal(lines.length, 1);
      assert.equal(lines[0].m, 'hello, world');
      const [request] = server.handledRequests;
      assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=50&pages=10&sort=ascending');
    });
    (0, _qunit.test)('it makes a call to logs api and no logs return with no more remaining', async function (assert) {
      assert.expect(3);
      noNewLogs();
      const service = this.owner.lookup('service:build-logs');
      const {
        lines,
        done
      } = await service.fetchLogs(serviceConfig);
      assert.notOk(done);
      assert.equal(lines.length, 0);
      const [request] = server.handledRequests;
      assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
    });
    (0, _qunit.test)('it handles log api failure by treating it as there are more logs', async function (assert) {
      assert.expect(3);
      badLogs();
      const service = this.owner.lookup('service:build-logs');
      const {
        lines,
        done
      } = await service.fetchLogs(serviceConfig);
      assert.notOk(done);
      assert.equal(lines.length, 0);
      const [request] = server.handledRequests;
      assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=10&sort=ascending');
    });
    (0, _qunit.test)('it handles fetching multiple pages', async function (assert) {
      assert.expect(3);
      noNewLogs();
      const service = this.owner.lookup('service:build-logs');
      const {
        lines,
        done
      } = await service.fetchLogs({
        logNumber: 0,
        pageSize: 100,
        ...serviceConfig
      });
      assert.notOk(done);
      assert.equal(lines.length, 0);
      const [request] = server.handledRequests;
      assert.equal(request.url, 'http://localhost:8080/v4/builds/1/steps/banana/logs?from=0&pages=100&sort=ascending');
    });
    (0, _qunit.test)('it can reset the cache', function (assert) {
      assert.expect(2);
      const service = this.owner.lookup('service:build-logs');
      assert.ok(service.get('cache'));
      assert.equal(Object.keys(service.get('cache')).length, 0);
    });
    (0, _qunit.test)('it creates and revokes object url', function (assert) {
      // assert.expect(5);
      const service = this.owner.lookup('service:build-logs');
      service.setCache(serviceConfig.buildId, serviceConfig.stepName, {
        logs: [{
          t: now,
          n: 0,
          m: 'hello, world'
        }]
      });
      const url = service.buildLogBlobUrl(serviceConfig.buildId, serviceConfig.stepName);
      assert.ok(url);
      assert.equal(service.getCache(serviceConfig.buildId, serviceConfig.stepName, 'blobUrl'), url);
      assert.equal(service.get('blobKeys')[0].toString(), [serviceConfig.buildId, serviceConfig.stepName].toString());
      service.revokeLogBlobUrls();
      assert.equal(service.get('blobKeys').length, 0);
      assert.equal(service.getCache(serviceConfig.buildId, serviceConfig.stepName, 'blobUrl'), undefined);
    });
  });
});
define("screwdriver-ui/tests/unit/build/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | build', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists and has statusMessage defaults to null', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build'));
      assert.ok(!!model);
      assert.equal(model.get('statusMessage'), null);
    });
    (0, _qunit.test)('it calculates blockedDuration', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244582531),
        stats: {
          imagePullStartTime: 'Fri Aug 26 2016 13:49:52 GMT-0700 (PDT)'
        }
      }));
      Ember.run(() => {
        assert.equal(model.get('blockedDuration'), '9 seconds');
        model.set('stats.imagePullStartTime', null);
        assert.equal(model.get('blockedDuration'), '0 seconds');
      });
    });
    (0, _qunit.test)('it calculates imagePullDuration', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        stats: {
          imagePullStartTime: 'Fri Aug 26 2016 13:48:52 GMT-0700 (PDT)'
        },
        startTime: new Date(1472244592531)
      }));
      Ember.run(() => {
        assert.equal(model.get('imagePullDuration'), '1 minute, 1 second');
        model.set('startTime', null);
        assert.equal(model.get('imagePullDuration'), '0 seconds');
      });
    });
    (0, _qunit.test)('it calculates buildDuration', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244572531),
        startTime: new Date(1472244582531),
        endTime: new Date(1472244592531)
      }));
      Ember.run(() => {
        // valid duration
        assert.equal(model.get('buildDuration'), '10 seconds'); // no end time, so duration is 0

        model.set('endTime', null);
        assert.equal(model.get('buildDuration'), '0 seconds'); // no start time, so duration is 0

        model.set('endTime', new Date(1472244592531));
        model.set('startTime', null);
        assert.equal(model.get('buildDuration'), '0 seconds');
      });
    });
    (0, _qunit.test)('it calculates totalDuration', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        createTime: new Date(1472244572531),
        startTime: new Date(1472244582531),
        endTime: new Date(1472244592531)
      }));
      Ember.run(() => {
        // valid duration
        assert.equal(model.get('totalDuration'), '20 seconds'); // no end time, so duration is 0

        model.set('endTime', null);
        assert.equal(model.get('totalDuration'), '0 seconds'); // no start time, so duration is 0

        model.set('endTime', new Date(1472244592531));
        model.set('createTime', null);
        assert.equal(model.get('totalDuration'), '0 seconds');
      });
    });
    (0, _qunit.test)('it humanizes createTime', function (assert) {
      const createTime = new Date(1472244582531);
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        createTime
      }));
      Ember.run(() => {
        assert.equal(model.get('createTimeWords'), "".concat(humanizeDuration(Date.now() - createTime, {
          round: true,
          largest: 1
        }), " ago"));
      });
    });
    (0, _qunit.test)('it truncates the sha', function (assert) {
      const sha = '026c5b76b210f96dc27011b553679a7663b38698';
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('build', {
        sha
      }));
      Ember.run(() => {
        assert.equal(model.get('truncatedSha'), '026c5b7');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/build/serializer-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | build', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it converts container to buildContainer and haves right defaults', async function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/builds/abcd', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd',
          container: 'node:6'
        })];
      });
      const build = await this.owner.lookup('service:store').findRecord('build', 'abcd');
      assert.equal(build.get('buildContainer'), 'node:6');
      assert.equal(build.get('statusMessage'), null);
    });
    (0, _qunit.test)('it POSTs only a jobId for create', async function (assert) {
      assert.expect(2);
      server.post('http://localhost:8080/v4/builds', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd'
        })];
      });
      const build = await this.owner.lookup('service:store').createRecord('build', {
        jobId: '1234'
      });
      await build.save();
      assert.equal(build.get('id'), 'abcd');
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        jobId: '1234'
      });
    });
    (0, _qunit.test)('it PUTs only a status for update', async function (assert) {
      assert.expect(1);
      server.put('http://localhost:8080/v4/builds/1234', function () {
        return [200, {}, JSON.stringify({
          id: 1234
        })];
      });
      this.owner.lookup('service:store').push({
        data: {
          id: 1234,
          type: 'build',
          attributes: {
            jobId: 'abcd',
            status: 'RUNNING'
          }
        }
      });
      const build = await this.owner.lookup('service:store').peekRecord('build', 1234);
      build.set('status', 'ABORTED');
      await build.save();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        status: 'ABORTED'
      });
    });
  });
});
define("screwdriver-ui/tests/unit/builds/route-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _test) {
  "use strict";

  (0, _qunit.module)('Unit | Route | builds', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      const route = this.owner.lookup('route:builds');
      assert.ok(route);
    });
    (0, _test.default)('it redirects', function (assert) {
      const route = this.owner.lookup('route:builds');
      const transitionStub = this.stub(route, 'transitionTo');
      const model = {
        pipeline: {
          id: 1
        },
        build: {
          id: 2
        }
      };
      route.redirect(model);
      assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
      assert.ok(transitionStub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline');
    });
    (0, _qunit.test)('it fetches pipeline & build', function (assert) {
      const dataMapping = {
        build_2: {
          type: 'build',
          jobId: 'jid',
          id: 2
        },
        job_jid: {
          type: 'job',
          id: 'jid',
          pipelineId: 1
        },
        pipeline_1: {
          type: 'job',
          id: 1
        }
      };
      const storeStub = Ember.Service.extend({
        findRecord(type, id) {
          return new Ember.RSVP.Promise(resolve => resolve(Ember.Object.create(dataMapping["".concat(type, "_").concat(id)])));
        }

      });
      this.owner.unregister('service:store');
      this.owner.register('service:store', storeStub);
      const route = this.owner.lookup('route:builds');
      return route.model({
        build_id: 2
      }).then(data => {
        const {
          build,
          pipeline
        } = data;
        assert.equal(pipeline.id, 1);
        assert.equal(build.id, 2);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/cache/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;
  const sessionStub = Ember.Service.extend({
    data: {
      authenticated: {
        token: 'faketoken'
      }
    }
  });
  (0, _qunit.module)('Unit | Service | cache', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:session'],

    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionStub);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:cache');
      assert.ok(service);
    });
    (0, _qunit.test)('it makes a call to delete pipeline cache successfully', function (assert) {
      server.delete('http://localhost:8081/v1/caches/pipelines/1', () => [204]);
      let service = this.owner.lookup('service:cache');
      assert.ok(service);
      const p = service.clearCache({
        scope: 'pipelines',
        id: '1'
      });
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.status, '204');
        assert.equal(request.method, 'DELETE');
        assert.equal(request.url, 'http://localhost:8081/v1/caches/pipelines/1');
      });
    });
    (0, _qunit.test)('it makes a call to delete job cache successfully', function (assert) {
      server.delete('http://localhost:8081/v1/caches/jobs/1', () => [204]);
      let service = this.owner.lookup('service:cache');
      assert.ok(service);
      const p = service.clearCache({
        scope: 'jobs',
        id: '1'
      });
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.status, '204');
        assert.equal(request.method, 'DELETE');
        assert.equal(request.url, 'http://localhost:8081/v1/caches/jobs/1');
      });
    });
    (0, _qunit.test)('it returns 401 on unauthorized deletion', function (assert) {
      assert.expect(2);
      server.delete('http://localhost:8081/v1/caches/pipelines/1', () => [401, {
        'Content-Type': 'application/json'
      }, 'Unauthorized']);
      let service = this.owner.lookup('service:cache');
      assert.ok(service);
      const p = service.clearCache({
        scope: 'pipelines',
        id: '1'
      });
      p.then(() => {}, err => {
        assert.equal(err, 'You do not have the permissions to clear the cache.');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/collection/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | collection', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('collection'));
      assert.ok(!!model);
    });
  });
});
define("screwdriver-ui/tests/unit/collection/serializer-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | collection', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it serializes records', function (assert) {
      let record = Ember.run(() => this.owner.lookup('service:store').createRecord('collection'));
      let serializedRecord = record.serialize();
      assert.ok(serializedRecord);
    });
    (0, _qunit.test)('it does not post with model name as key', async function (assert) {
      assert.expect(2);
      server.post('http://localhost:8080/v4/collections', function () {
        return [200, {}, JSON.stringify({
          id: 123
        })];
      });
      const collection = this.owner.lookup('service:store').createRecord('collection', {
        name: 'Screwdriver',
        description: 'Collection of screwdriver pipelines'
      });
      await collection.save();
      assert.equal(collection.get('id'), 123);
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        name: 'Screwdriver',
        description: 'Collection of screwdriver pipelines'
      });
    });
    (0, _qunit.test)('it serializes only dirty fields', async function (assert) {
      assert.expect(1);
      server.put('http://localhost:8080/v4/collections/123', function () {
        return [200, {}, JSON.stringify({
          id: 123
        })];
      });
      this.owner.lookup('service:store').push({
        data: {
          id: 123,
          type: 'collection',
          attributes: {
            name: 'Screwdriver',
            description: 'Collection of screwdriver pipelines'
          }
        }
      });
      const collection = this.owner.lookup('service:store').peekRecord('collection', 123);
      collection.set('description', 'newDescription');
      await collection.save();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        description: 'newDescription'
      });
    });
  });
});
define("screwdriver-ui/tests/unit/command/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  const sessionStub = Ember.Service.extend({
    data: {
      authenticated: {
        token: 'faketoken'
      }
    }
  });
  const createTime = '2016-09-23T16:53:00.274Z';
  const created = new Date(createTime).getTime();
  const lastUpdated = "".concat(humanizeDuration(Date.now() - created, {
    round: true,
    largest: 1
  }), " ago");
  const dummyCommands = [{
    id: 2,
    namespace: 'foo',
    name: 'bar',
    version: '2.0.0',
    createTime
  }, {
    id: 1,
    namespace: 'foo',
    name: 'bar',
    version: '1.0.0',
    createTime
  }];
  const dummyCommandsResult = dummyCommands.map(c => {
    c.lastUpdated = lastUpdated;
    return c;
  });
  const dummyCommandTags = [{
    id: 2,
    namespace: 'foo',
    name: 'bar',
    tag: 'latest',
    version: '2.0.0',
    createTime
  }, {
    id: 1,
    namespace: 'foo',
    name: 'bar',
    tag: 'stable',
    version: '1.0.0',
    createTime
  }];
  const dummyCommandTagsResult = dummyCommandTags.map(c => {
    c.lastUpdated = lastUpdated;
    return c;
  });
  let server;
  (0, _qunit.module)('Unit | Service | command', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionStub);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it fetches one set of command version', function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/commands/foo/bar', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(dummyCommands)]);
      let service = this.owner.lookup('service:command');
      assert.ok(service);
      const t = service.getOneCommand('foo', 'bar');
      t.then(commands => {
        assert.deepEqual(commands, dummyCommandsResult);
      });
    });
    (0, _qunit.test)('it fetches one set of command tags', function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/commands/foo/bar/tags', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(dummyCommandTags)]);
      let service = this.owner.lookup('service:command');
      assert.ok(service);
      const t = service.getCommandTags('foo', 'bar');
      t.then(commands => {
        assert.deepEqual(commands, dummyCommandTagsResult);
      });
    });
    (0, _qunit.test)('it fetches all commands', function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/commands', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(dummyCommands)]);
      let service = this.owner.lookup('service:command');
      assert.ok(service);
      const t = service.getAllCommands();
      const filteredCommands = [{
        id: 2,
        namespace: 'foo',
        name: 'bar',
        version: '2.0.0',
        createTime,
        lastUpdated
      }];
      t.then(commands => {
        assert.deepEqual(commands, filteredCommands);
      });
    });
    (0, _qunit.test)('it deletes all versions of a command', function (assert) {
      assert.expect(4);
      server.delete('http://localhost:8080/v4/commands/foo/bar', () => [204]);
      let service = this.owner.lookup('service:command');
      assert.ok(service);
      const t = service.deleteCommands('foo', 'bar');
      t.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.status, '204');
        assert.equal(request.method, 'DELETE');
        assert.equal(request.url, 'http://localhost:8080/v4/commands/foo/bar');
      });
    });
    (0, _qunit.test)('it returns 401 on unauthorized deletion', function (assert) {
      assert.expect(2);
      server.delete('http://localhost:8080/v4/commands/foo/bar', () => [401, {
        'Content-Type': 'application/json'
      }, 'Unauthorized']);
      let service = this.owner.lookup('service:command');
      assert.ok(service);
      const t = service.deleteCommands('foo', 'bar');
      t.then(() => {}, err => {
        assert.equal(err, 'You do not have the permissions to remove this command.');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/commands/controller-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _test) {
  "use strict";

  (0, _qunit.module)('Unit | Controller | Commands', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _test.default)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:commands');
      assert.ok(controller);
    });
    (0, _test.default)('it creates correct breadcrumbs', function (assert) {
      const controller = this.owner.lookup('controller:commands');
      Ember.run(() => {
        controller.set('routeParams', {
          namespace: 'testNamespace',
          name: 'testName'
        });
        assert.deepEqual(controller.get('crumbs'), [{
          name: 'Commands',
          params: ['commands']
        }, {
          name: 'testNamespace',
          params: ['commands.namespace', 'testNamespace']
        }, {
          name: 'testName',
          params: ['commands.detail', 'testNamespace', 'testName']
        }]);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/commands/detail/controller-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const commandServiceStub = Ember.Service.extend({
    deleteCommands() {
      return Ember.RSVP.resolve([204]);
    }

  });
  (0, _qunit.module)('Unit | Controller | commands/detail', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:command', commandServiceStub);
    });
    (0, _qunit.test)('it parses model properly', function (assert) {
      let controller = this.owner.lookup('controller:commands/detail');
      controller.set('model', [{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('latest.id'), 3);
      assert.equal(controller.get('versionCommand.id'), 3);
    });
    (0, _qunit.test)('it handles version changes', function (assert) {
      let controller = this.owner.lookup('controller:commands/detail');
      controller.set('model', [{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('latest.id'), 3);
      assert.equal(controller.get('versionCommand.id'), 3);
      controller.send('changeVersion', '1.0.0');
      assert.equal(controller.get('selectedVersion'), '1.0.0');
      assert.equal(controller.get('versionCommand.id'), 1);
      assert.equal(controller.get('latest.id'), 3);
    });
    (0, _qunit.test)('it handles model changes', function (assert) {
      let controller = this.owner.lookup('controller:commands/detail'); // eslint-disable-next-line new-cap

      const arr = Ember.A([{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      controller.set('model', arr);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('versionCommand.id'), 3);
      assert.equal(controller.get('latest.id'), 3);
      controller.send('changeVersion', '1.0.0');
      assert.equal(controller.get('selectedVersion'), '1.0.0');
      assert.equal(controller.get('versionCommand.id'), 1);
      arr.unshiftObject({
        id: 4,
        version: '4.0.0'
      });
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('versionCommand.id'), 4);
      assert.equal(controller.get('latest.id'), 4);
    });
    (0, _qunit.test)('it handles command deletion', function (assert) {
      let controller = this.owner.lookup('controller:commands/detail'); // eslint-disable-next-line new-cap

      const arr = Ember.A([{
        id: 3,
        name: 'sample',
        version: '3.0.0'
      }, {
        id: 2,
        name: 'sample',
        version: '2.0.0'
      }, {
        id: 1,
        name: 'sample',
        version: '1.0.0'
      }]);
      controller.set('model', arr);
      assert.ok(controller);

      controller.transitionToRoute = route => {
        assert.equal(route, 'commands');
      };

      controller.send('removeCommand', 'sample');
    });
  });
});
define("screwdriver-ui/tests/unit/commands/detail/router-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const commandServiceStub = Ember.Service.extend({
    getOneCommand(namespace, name) {
      return Ember.RSVP.resolve([{
        id: 3,
        namespace,
        name,
        version: '3.0.0'
      }, {
        id: 2,
        namespace,
        name,
        version: '2.0.0'
      }, {
        id: 1,
        namespace,
        name,
        version: '1.0.0'
      }]);
    },

    getCommandTags(namespace, name) {
      return Ember.RSVP.resolve([{
        id: 3,
        namespace,
        name,
        version: '3.0.0',
        tag: 'latest'
      }, {
        id: 2,
        namespace,
        name,
        version: '2.0.0',
        tag: 'stable'
      }, {
        id: 1,
        namespace,
        name,
        version: '1.0.0'
      }]);
    }

  });
  (0, _qunit.module)('Unit | Route | commands/detail', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:command', commandServiceStub);
    });
    (0, _qunit.test)('it asks for the list of commands for a given namespace and name', function (assert) {
      let route = this.owner.lookup('route:commands/detail');
      assert.ok(route);
      return route.model({
        namespace: 'foo',
        name: 'bar'
      }).then(commands => {
        assert.equal(commands[0].name, 'bar');
        assert.equal(commands[0].namespace, 'foo');
        assert.equal(commands[0].tag, 'latest');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/commands/index/router-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const commandServiceStub = Ember.Service.extend({
    getAllCommands() {
      return Ember.RSVP.resolve([{
        id: 3,
        namespace: 'foo',
        name: 'foo',
        version: '3.0.0'
      }, {
        id: 2,
        namespace: 'foo',
        name: 'bar',
        version: '2.0.0'
      }, {
        id: 1,
        namespace: 'foo',
        name: 'baz',
        version: '1.0.0'
      }]);
    }

  });
  (0, _qunit.module)('Unix | Route | commands/index', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:command', commandServiceStub);
    });
    (0, _qunit.test)('it dedupes the commands by namespace and name', function (assert) {
      let route = this.owner.lookup('route:commands/index');
      assert.ok(route);
      return route.model().then(commands => {
        assert.equal(commands.length, 3);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/commands/router-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | commands', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:commands');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/coverage/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  const sessionStub = Ember.Service.extend({
    data: {
      authenticated: {
        token: 'faketoken'
      }
    }
  });
  let server;
  (0, _qunit.module)('Unit | Service | coverage ', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionStub);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it fetches coverage info', function (assert) {
      assert.expect(3);
      server.get('http://localhost:8080/v4/coverage/info', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        coverage: 98,
        projectUrl: 'https://sonar.foo.bar',
        tests: '7/10'
      })]);
      let service = this.owner.lookup('service:coverage');
      assert.ok(service);
      const config = {
        buildId: 123,
        jobId: 1,
        startTime: '2018-05-10T19:05:53.123Z',
        endTime: '2018-05-10T19:06:53.123Z'
      };
      const p = service.getCoverageInfo(config);
      p.then(data => {
        const [request] = server.handledRequests;
        assert.deepEqual(data, {
          coverage: '98%',
          coverageUrl: 'https://sonar.foo.bar',
          tests: '7/10',
          testsUrl: 'https://sonar.foo.bar'
        });
        assert.deepEqual(request.url, // eslint-disable-next-line max-len
        'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z');
      });
    });
    (0, _qunit.test)('it sets default coverage info when request failed', function (assert) {
      assert.expect(3);
      server.get('http://localhost:8080/v4/coverage/info', () => [500, {
        'Content-Type': 'application/json'
      }, JSON.stringify({})]);
      let service = this.owner.lookup('service:coverage');
      assert.ok(service);
      const config = {
        buildId: 123,
        jobId: 1,
        startTime: '2018-05-10T19:05:53.123Z',
        endTime: '2018-05-10T19:06:53.123Z'
      };
      const p = service.getCoverageInfo(config);
      p.then(data => {
        const [request] = server.handledRequests;
        assert.deepEqual(data, {
          coverage: 'N/A',
          coverageUrl: '#',
          tests: 'N/A',
          testsUrl: '#'
        });
        assert.deepEqual(request.url, // eslint-disable-next-line max-len
        'http://localhost:8080/v4/coverage/info?buildId=123&jobId=1&startTime=2018-05-10T19%3A05%3A53.123Z&endTime=2018-05-10T19%3A06%3A53.123Z');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/create/controller-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _test) {
  "use strict";

  (0, _qunit.module)('Unit | Controller | create', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _test.default)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:create');
      assert.ok(controller);
    });
    (0, _test.default)('it should handle duplicate error on pipeline save', function (assert) {
      const controller = this.owner.lookup('controller:create');
      const done = assert.async();
      const conflictError = {
        status: 409,
        data: {
          existingId: 1
        }
      };
      const stub = this.stub(controller, 'transitionToRoute');
      stub.callsFake(function () {
        assert.ok(stub.calledOnce, 'transitionToRoute was called once');
        assert.ok(stub.calledWithExactly('pipeline', 1), 'invalid data');
        done();
      });
      controller.set('store', {
        createRecord(modelName, data) {
          assert.equal(modelName, 'pipeline');
          assert.equal(data.checkoutUrl, 'dummy');
          assert.equal(data.rootDir, '');
          return {
            save: () => Ember.RSVP.reject({
              errors: [conflictError]
            })
          };
        }

      });
      controller.send('createPipeline', {
        scmUrl: 'dummy',
        rootDir: ''
      });
    });
  });
});
define("screwdriver-ui/tests/unit/create/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | create', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:create');
      assert.ok(route);
      assert.equal(route.titleToken, 'Create Pipeline');
    });
  });
});
define("screwdriver-ui/tests/unit/dashboard/index/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | dashboard/index', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:dashboard/index');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/dashboard/show/controller-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _test, _injectSession) {
  "use strict";

  (0, _qunit.module)('Unit | Controller | dashboard/show', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Replace this with your real tests.

    (0, _qunit.test)('it exists', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:dashboard/show');
      assert.ok(controller);
    });
    (0, _qunit.test)('it calls removePipeline', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:dashboard/show');
      let pipelineIds = [1, 2, 3];
      const mock = Ember.Object.create({
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds,

        save() {
          assert.deepEqual(Ember.get(this, 'pipelineIds'), [1, 2]);
          return Ember.RSVP.resolve(this);
        }

      });
      controller.set('store', {
        findRecord(modelName, collectionId) {
          assert.strictEqual(modelName, 'collection');
          assert.strictEqual(collectionId, 1);
          return Ember.RSVP.resolve(mock);
        }

      }); // Remove pipeline with id 3 from collection with id 1

      controller.send('removePipeline', 3, 1);
    });
    (0, _test.default)('it calls onDeleteCollection', function (assert) {
      const controller = this.owner.lookup('controller:dashboard/show');
      const stub = this.stub(controller, 'transitionToRoute');
      controller.send('onDeleteCollection');
      assert.ok(stub.calledOnce, 'transitionToRoute was called once');
      assert.ok(stub.calledWithExactly('home'), 'transition to home');
    });
  });
});
define("screwdriver-ui/tests/unit/dashboard/show/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | dashboard/show', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:dashboard/show');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/event-stop/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;

  const stop = () => {
    server.put('http://localhost:8080/v4/events/1/stop', () => [200]);
  };

  const stopFailed = () => {
    server.put('http://localhost:8080/v4/events/1/stop', () => [500, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })]);
  };

  (0, _qunit.module)('Unit | Service | event-stop', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:event-stop');
      assert.ok(service);
    });
    (0, _qunit.test)('it makes a call to stop all builds in an event', function (assert) {
      assert.expect(1);
      stop();
      const service = this.owner.lookup('service:event-stop');
      const e = service.stopBuilds(1);
      e.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/events/1/stop');
      });
    });
    (0, _qunit.test)('it fails to stop all builds in an event with error message ', function (assert) {
      assert.expect(2);
      stopFailed();
      const service = this.owner.lookup('service:event-stop');
      const e = service.stopBuilds(1);
      e.catch(error => {
        assert.equal(error, 'internal server error');
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/events/1/stop');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/event/model-test", ["qunit", "ember-qunit", "@ember/test-helpers"], function (_qunit, _emberQunit, _testHelpers) {
  "use strict";

  (0, _qunit.module)('Unit | Model | event', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      assert.ok(!!this.owner.lookup('service:store').createRecord('event'));
    });
    (0, _qunit.test)('it is not completed when there are no builds', async function (assert) {
      const model = this.owner.lookup('service:store').createRecord('event');
      await (0, _testHelpers.settled)();
      const isComplete = Ember.get(model, 'isComplete');
      assert.notOk(isComplete);
    }); // Testing observers is messy, need to change the model value, then schedule to read the newly set value later

    (0, _qunit.test)('it is not completed when the a build is not complete', async function (assert) {
      const build = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        status: 'RUNNING'
      });
      const model = this.owner.lookup('service:store').createRecord('event');
      Ember.run(() => model.set('builds', [build]));
      await (0, _testHelpers.settled)();
      assert.notOk(model.get('isComplete'));
    });
    (0, _qunit.test)('it is not completed when new builds created during reload', async function (assert) {
      assert.expect(3);
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        status: 'SUCCESS'
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        status: 'SUCCESS'
      });
      const build3 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 3,
        status: 'SUCCESS'
      });
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      let reloadCnt = 0;
      Ember.run(() => {
        model.set('builds', [build1]);
        model.set('buildId', 121);
        model.set('startReloading', function () {
          reloadCnt += 1;

          if (reloadCnt > 2) {
            return;
          } // During each reload, add one new build


          if (reloadCnt === 1) {
            this.set('builds', [build2, build1]);
          } else {
            this.set('builds', [build3, build2, build1]);
          } // New build added during reload, event not complete


          const isComplete = Ember.get(model, 'isComplete');
          assert.notOk(isComplete);
        });
      });
      await (0, _testHelpers.settled)(); // Since no new builds added after 2 reloads, event eventually finishes

      const isComplete = Ember.get(model, 'isComplete');
      assert.ok(isComplete);
    });
    (0, _qunit.test)('it is complete when all builds have run', async function (assert) {
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        status: 'SUCCESS'
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        status: 'SUCCESS'
      });
      const build3 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 3,
        status: 'SUCCESS'
      });
      const build4 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 4,
        status: 'SUCCESS'
      });
      const build5 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 5,
        status: 'SUCCESS'
      });
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', [build5, build4, build3, build2, build1]));
      await (0, _testHelpers.settled)();
      const isComplete = Ember.get(model, 'isComplete');
      assert.ok(isComplete);
    });
    (0, _qunit.test)('it is RUNNING when there are no builds', async function (assert) {
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', []));
      await (0, _testHelpers.settled)();
      const status = Ember.get(model, 'status');
      assert.equal(status, 'RUNNING');
    });
    (0, _qunit.test)('it returns build status when a build is not SUCCESS', async function (assert) {
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        status: 'ABORTED'
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        status: 'SUCCESS'
      });
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', [build2, build1]));
      await (0, _testHelpers.settled)();
      const status = Ember.get(model, 'status');
      assert.equal(status, 'ABORTED');
    });
    (0, _qunit.test)('it is SUCCESS when all expected builds have run successfully', async function (assert) {
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        status: 'SUCCESS'
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        status: 'SUCCESS'
      });
      const build3 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 3,
        status: 'SUCCESS'
      });
      const build4 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 4,
        status: 'SUCCESS'
      });
      const build5 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 5,
        status: 'SUCCESS'
      });
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', [build5, build4, build3, build2, build1]));
      await (0, _testHelpers.settled)();
      const status = Ember.get(model, 'status');
      assert.equal(status, 'SUCCESS');
    });
    (0, _qunit.test)('it returns event duration whenever builds have run in parallel', async function (assert) {
      const eventStartTime = 1472244582531;
      const elapsed10secsTime = eventStartTime + 10000;
      const elapsed20secsTime = eventStartTime + 20000;
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        createTime: new Date(eventStartTime),
        endTime: new Date(elapsed10secsTime),
        status: 'SUCCESS'
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        createTime: new Date(eventStartTime),
        endTime: new Date(elapsed20secsTime),
        status: 'ABORTED'
      });
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', [build2, build1]));
      await (0, _testHelpers.settled)();
      const duration = Ember.get(model, 'duration');
      assert.equal(duration, 20000);
    });
    (0, _qunit.test)('it returns event duration until now if not completed yet', async function (assert) {
      const eventStartTime = 1472244582531;
      const elapsed10secsTime = eventStartTime + 10000;
      const elapsed20secsTime = eventStartTime + 20000;
      const build1 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 1,
        createTime: new Date(eventStartTime),
        endTime: new Date(elapsed10secsTime)
      });
      const build2 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 2,
        createTime: new Date(eventStartTime),
        endTime: new Date(elapsed10secsTime)
      });
      const build3 = this.owner.lookup('service:store').createRecord('build', {
        jobId: 3,
        createTime: new Date(elapsed20secsTime),
        status: 'RUNNING'
      });
      const testStartTime = new Date().getTime();
      const model = Ember.run(() => this.owner.lookup('service:store').createRecord('event'));
      Ember.run(() => model.set('builds', [build2, build1, build3]));
      await (0, _testHelpers.settled)();
      const duration = Ember.get(model, 'duration');
      const testFinishedTime = new Date().getTime();
      assert.ok(duration >= testStartTime - eventStartTime, "duration ".concat(duration, " should be equal or longer than test start ").concat(testStartTime));
      assert.ok(duration <= testFinishedTime - eventStartTime, "duration ".concat(duration, " should be equal or shorter than test finished ").concat(testFinishedTime));
    });
  });
});
define("screwdriver-ui/tests/unit/helpers/ansi-colorize-test", ["screwdriver-ui/helpers/ansi-colorize", "qunit"], function (_ansiColorize, _qunit) {
  "use strict";

  (0, _qunit.module)('Unit | Helper | ansi colorize', function () {
    // Replace this with your real tests.
    (0, _qunit.test)('it escapes html', function (assert) {
      let result = (0, _ansiColorize.ansiColorize)(['<main>']);
      assert.equal(result.toString(), '&lt;main&gt;');
    });
    (0, _qunit.test)('colorizes ansi codes', function (assert) {
      let result = (0, _ansiColorize.ansiColorize)(['\u001b[32m<main>\u001b[0m']);
      assert.equal(result.toString(), '<span class="ansi-green-fg">&lt;main&gt;</span>');
    });
  });
});
define("screwdriver-ui/tests/unit/helpers/get-last-build-test", ["screwdriver-ui/helpers/get-last-build", "qunit"], function (_getLastBuild, _qunit) {
  "use strict";

  (0, _qunit.module)('Unit | Helper | get last build', function () {
    (0, _qunit.test)('it returns the last build', function (assert) {
      // eslint-disable-next-line new-cap
      let result = (0, _getLastBuild.getLastBuild)([Ember.A(['obj1', 'obj2'])]);
      assert.deepEqual(result, 'obj1');
    });
    (0, _qunit.test)('it returns empty string when builds array is empty', function (assert) {
      // eslint-disable-next-line new-cap
      let result = (0, _getLastBuild.getLastBuild)([[]]);
      assert.notOk(result);
      assert.deepEqual(result, '');
    });
  });
});
define("screwdriver-ui/tests/unit/helpers/index-of-test", ["screwdriver-ui/helpers/index-of", "qunit"], function (_indexOf, _qunit) {
  "use strict";

  (0, _qunit.module)('Unit | Helper | index of', function () {
    // Replace this with your real tests.
    (0, _qunit.test)('it works', function (assert) {
      assert.equal((0, _indexOf.indexOf)([['a', 'b', 'c'], 0]), 'a');
      assert.equal((0, _indexOf.indexOf)([['a', 'b', 'c'], 1]), 'b');
      assert.equal((0, _indexOf.indexOf)([['a', 'b', 'c'], 2]), 'c');
    });
  });
});
define("screwdriver-ui/tests/unit/home/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | home', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:home');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/instance-initializers/supplementary-config-test", ["screwdriver-ui/instance-initializers/supplementary-config", "qunit", "screwdriver-ui/config/environment"], function (_supplementaryConfig, _qunit, _environment) {
  "use strict";

  const NAMESPACE = _environment.default.APP.SDAPI_NAMESPACE;
  const HOSTNAME = _environment.default.APP.SDAPI_HOSTNAME;
  const {
    SDDOC_URL,
    SLACK_URL
  } = _environment.default.APP;
  (0, _qunit.module)('Unit | Instance Initializer | supplementary config', function (hooks) {
    hooks.beforeEach(function () {
      Ember.run(() => {
        this.application = Ember.Application.create();
        this.appInstance = this.application.buildInstance();
        delete window.SUPPLEMENTARY_CONFIG;
      });
    });
    hooks.afterEach(function () {
      Ember.run(this.appInstance, 'destroy');
      Ember.run(this.application, 'destroy');
      delete window.SUPPLEMENTARY_CONFIG;
      _environment.default.APP.SDAPI_NAMESPACE = NAMESPACE;
      _environment.default.APP.SDAPI_HOSTNAME = HOSTNAME;
      _environment.default.APP.SDDOC_URL = SDDOC_URL;
      _environment.default.APP.SLACK_URL = SLACK_URL;
    });
    (0, _qunit.test)('it uses the pre-configured settings', function (assert) {
      (0, _supplementaryConfig.initialize)(this.appInstance);
      assert.equal(_environment.default.APP.SDAPI_NAMESPACE, NAMESPACE);
      assert.equal(_environment.default.APP.SDAPI_HOSTNAME, HOSTNAME);
      assert.equal(_environment.default.APP.SDDOC_URL, SDDOC_URL);
      assert.equal(_environment.default.APP.SLACK_URL, SLACK_URL);
    });
    (0, _qunit.test)('it uses the supplementary-config settings', function (assert) {
      window.SUPPLEMENTARY_CONFIG = {
        SDAPI_NAMESPACE: 'v5',
        SDAPI_HOSTNAME: 'http://example.com',
        SDDOC_URL: 'http://custom.doc',
        SLACK_URL: 'http://custom.slack'
      };
      (0, _supplementaryConfig.initialize)(this.appInstance);
      assert.equal(_environment.default.APP.SDAPI_NAMESPACE, 'v5');
      assert.equal(_environment.default.APP.SDAPI_HOSTNAME, 'http://example.com');
      assert.equal(_environment.default.APP.SDDOC_URL, 'http://custom.doc');
      assert.equal(_environment.default.APP.SLACK_URL, 'http://custom.slack');
    });
  });
});
define("screwdriver-ui/tests/unit/job/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | job', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('job')); // let store = this.store();

      assert.ok(!!model);
    });
  });
});
define("screwdriver-ui/tests/unit/job/serializer-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | job', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it serializes records', function (assert) {
      let record = Ember.run(() => this.owner.lookup('service:store').createRecord('job'));
      let serializedRecord = record.serialize();
      assert.ok(serializedRecord);
    });
    (0, _qunit.test)('it serializes only dirty fields', function (assert) {
      assert.expect(1);
      server.put('http://localhost:8080/v4/jobs/abcd', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd'
        })];
      });
      Ember.run(() => {
        this.owner.lookup('service:store').push({
          data: {
            id: 'abcd',
            type: 'job',
            attributes: {
              pipelineId: 'aabb',
              name: 'main',
              state: 'ENABLED'
            }
          }
        });
        const job = this.owner.lookup('service:store').peekRecord('job', 'abcd');
        job.set('state', 'DISABLED');
        job.save();
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          state: 'DISABLED'
        });
      });
    });
  });
});
define("screwdriver-ui/tests/unit/login/controller-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  let authType = null;
  const sessionServiceMock = Ember.Service.extend({
    authenticate(authenticatorType) {
      authType = authenticatorType;
    }

  });
  (0, _qunit.module)('Unit | Controller | login', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function () {
      this.owner.register('service:session', sessionServiceMock);
      this.session = this.owner.lookup('service:session');
    });
    (0, _qunit.test)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:login');
      assert.ok(controller);
    });
    (0, _qunit.test)('it calls session.authenticate', function (assert) {
      let controller = this.owner.lookup('controller:login');
      controller.send('authenticate');
      assert.equal(authType, 'authenticator:screwdriver-api');
    });
  });
});
define("screwdriver-ui/tests/unit/login/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | login', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:login');
      assert.ok(route);
      assert.equal(route.titleToken, 'Login');
    });
  });
});
define("screwdriver-ui/tests/unit/metric/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | metric', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('metric'));
      assert.ok(!!model);
    });
  });
});
define("screwdriver-ui/tests/unit/mixins/model-reloader-test", ["screwdriver-ui/mixins/model-reloader", "qunit", "ember-qunit", "ember-data"], function (_modelReloader, _qunit, _emberQunit, _emberData) {
  "use strict";

  let subject;
  (0, _qunit.module)('Unit | Mixin | model reloader mixin', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      const ModelReloaderObject = _emberData.default.Model.extend(_modelReloader.default);

      this.owner.register('model:reload-mixin', ModelReloaderObject);
      subject = this.owner.lookup('service:store').createRecord('reload-mixin', {
        isPaused: false
      });
    });
    (0, _qunit.test)('it mixes in to an ember object', function (assert) {
      assert.ok(typeof subject.startReloading === 'function');
    });
    (0, _qunit.test)('it try to start a reloading model', function (assert) {
      subject.set('scheduleReload', () => {
        subject.set('runLater', 'foo');
      });
      subject.startReloading();
      assert.equal(subject.get('runLater'), 'foo');
    });
    (0, _qunit.test)('it not try to start a reloading model', function (assert) {
      subject.set('runLater', 1);
      subject.set('scheduleReload', () => {
        subject.set('runLater', 'foo');
      });
      subject.startReloading();
      assert.equal(subject.get('runLater'), 1);
    });
    (0, _qunit.test)('it will stop a reloading model', function (assert) {
      subject.set('runLater', 1);
      subject.stopReloading();
      assert.notOk(subject.get('runLater'));
    });
    (0, _qunit.test)('it calls reload on a model', function (assert) {
      assert.expect(1);
      subject.set('testModel', {
        reload() {
          assert.ok(true);
          return Ember.RSVP.resolve({});
        }

      });
      subject.set('runLater', 'foo');
      subject.set('modelToReload', 'testModel');
      subject.reloadModel();
    });
    (0, _qunit.test)('it should not reload a model if shouldReload returns false', function (assert) {
      assert.expect(1);
      const testModel = {
        reload() {
          assert.ok(true);
          return Promise.resolve({});
        }

      };
      subject.set('testModel', testModel);
      subject.set('shouldReload', m => {
        assert.equal(m, testModel);
        return false;
      });
      subject.set('modelToReload', 'testModel');
      subject.reloadModel();
    });
    (0, _qunit.test)('it force reloads a model', async function (assert) {
      assert.expect(2);
      subject.set('testModel', {
        reload() {
          assert.ok(true);
          return Ember.RSVP.resolve({});
        }

      });
      subject.set('modelToReload', 'testModel');
      subject.forceReload();
      Ember.run(() => {
        assert.ok(true);
      });
    });
    (0, _qunit.test)('it calls reload function if modelToReload is absent', function (assert) {
      assert.expect(1);
      subject.set('reload', function () {
        assert.ok(true);
        return Ember.RSVP.resolve({});
      });
      subject.set('runLater', 'foo');
      subject.reloadModel();
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline-startall/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;

  const startAll = () => {
    server.post('http://localhost:8080/v4/pipelines/1/startall', () => [204]);
  };

  const startAllFailed = () => {
    server.post('http://localhost:8080/v4/pipelines/1/startall', () => [500, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })]);
  };

  (0, _qunit.module)('Unit | Service | pipeline start all', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:pipeline-startall');
      assert.ok(service);
    });
    (0, _qunit.test)('it makes a call start all child pipelines', function (assert) {
      assert.expect(1);
      startAll();
      const service = this.owner.lookup('service:pipeline-startall');
      const p = service.startAll(1, undefined);
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/startall');
      });
    });
    (0, _qunit.test)('it fails to start all child piplines with error message ', function (assert) {
      assert.expect(2);
      startAllFailed();
      const service = this.owner.lookup('service:pipeline-startall');
      const p = service.startAll(1, undefined);
      p.catch(error => {
        assert.equal(error, 'internal server error');
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/startall');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline-triggers/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;

  const getTriggers = () => {
    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [200, {
      'Content-Type': 'application/json'
    }, JSON.stringify([{
      jobName: 'main',
      triggers: ['~sd@2:main', '~sd@3:deploy']
    }, {
      jobName: 'prod',
      triggers: ['~sd@4:main']
    }])]);
  };

  const getTriggersFailed = () => {
    server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [500, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })]);
  };

  (0, _qunit.module)('Unit | Service | pipeline triggers', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:pipeline-triggers');
      assert.ok(service);
    });
    (0, _qunit.test)('it makes a call to get all pipeline triggers', function (assert) {
      assert.expect(1);
      getTriggers();
      const service = this.owner.lookup('service:pipeline-triggers');
      const p = service.getDownstreamTriggers(1);
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/triggers');
      });
    });
    (0, _qunit.test)('it fails to get pipeline triggers with error message ', function (assert) {
      assert.expect(2);
      getTriggersFailed();
      const service = this.owner.lookup('service:pipeline-triggers');
      const p = service.getDownstreamTriggers(1);
      p.catch(error => {
        assert.equal(error, '500 internal server error');
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/triggers');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/build/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender", "sinon", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _testHelpers, _pretender, _sinon, _test) {
  "use strict";

  const invalidateStub = _sinon.default.stub();

  const prEventsService = Ember.Service.extend({
    getPrEvents() {
      return Ember.RSVP.resolve();
    }

  });
  const sessionServiceMock = Ember.Service.extend({
    isAuthenticated: true,
    invalidate: invalidateStub,
    data: {
      authenticated: {
        // fake token for test, it has { username: apple } inside
        // eslint-disable-next-line max-len
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
      }
    }
  });
  let server;
  (0, _qunit.module)('Unit | Controller | pipeline/build', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionServiceMock);
      this.owner.register('service:pr-events', prEventsService);
    });
    hooks.afterEach(function () {
      server.shutdown();
      invalidateStub.reset();
    });
    (0, _qunit.test)('it exists', function (assert) {
      assert.ok(this.owner.lookup('controller:pipeline/build'));
    });
    (0, _qunit.test)('it restarts a build', async function (assert) {
      assert.expect(5);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '5678'
      })]);
      server.get('http://localhost:8080/v4/events/5678/builds', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: '9999'
      }])]);
      const controller = this.owner.lookup('controller:pipeline/build');
      Ember.run(() => {
        controller.set('model', {
          build: Ember.Object.create({
            id: '123'
          }),
          job: Ember.Object.create({
            name: 'PR-1:main'
          }),
          event: Ember.Object.create({
            id: '1',
            sha: 'sha'
          })
        });
        assert.notOk(controller.get('isShowingModal'));

        controller.transitionToRoute = (path, id) => {
          assert.equal(path, 'pipeline.build');
          assert.equal(id, 9999);
        };

        controller.send('startBuild');
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        buildId: 123,
        causeMessage: 'Manually started by apple'
      });
    });
    (0, _qunit.test)('it fails to restart a build', async function (assert) {
      assert.expect(6);
      server.post('http://localhost:8080/v4/events', () => [401, {}, JSON.stringify({
        statusCode: 401,
        error: 'unauthorized',
        message: 'User does not have permission'
      })]);
      server.get('http://localhost:8080/v4/events/5678/builds', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: '9999'
      }])]);
      const controller = this.owner.lookup('controller:pipeline/build');
      Ember.run(() => {
        controller.set('model', {
          build: Ember.Object.create({
            id: '123'
          }),
          job: Ember.Object.create({
            name: 'PR-1:main'
          }),
          event: Ember.Object.create({
            id: '1',
            sha: 'sha'
          })
        });
        assert.notOk(controller.get('isShowingModal'));
        controller.send('startBuild');
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        buildId: 123,
        causeMessage: 'Manually started by apple'
      });
      assert.notOk(controller.get('isShowingModal'));
      assert.ok(invalidateStub.called);
      assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
    });
    (0, _qunit.test)('it stops a build', async function (assert) {
      assert.expect(2);
      server.put('http://localhost:8080/v4/builds/5678', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '5678',
        status: 'ABORTED'
      })]);
      const controller = this.owner.lookup('controller:pipeline/build');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '5678',
            type: 'build',
            attributes: {
              jobId: '123'
            }
          }
        });
        const build = controller.store.peekRecord('build', 5678);
        controller.set('model', {
          build
        });
        controller.send('stopBuild');
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        status: 'ABORTED'
      });
      assert.deepEqual(controller.get('errorMessage'), '');
    });
    (0, _qunit.test)('it fails to stop a build', async function (assert) {
      assert.expect(3);
      server.put('http://localhost:8080/v4/builds/5678', () => [401, {}, JSON.stringify({
        statusCode: 401,
        error: 'unauthorized',
        message: 'User does not have permission'
      })]);
      const controller = this.owner.lookup('controller:pipeline/build');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '5678',
            type: 'build',
            attributes: {
              jobId: '123'
            }
          }
        });
        const build = controller.store.peekRecord('build', 5678);
        controller.set('model', {
          build
        });
        controller.send('stopBuild');
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.deepEqual(payload, {
        status: 'ABORTED'
      });
      assert.ok(invalidateStub.called);
      assert.deepEqual(controller.get('errorMessage'), 'User does not have permission');
    });
    (0, _qunit.test)('it reloads a build', async function (assert) {
      assert.expect(4);
      const controller = this.owner.lookup('controller:pipeline/build');
      const build = Ember.Object.create({
        id: '5678',
        jobId: 'abcd',
        status: 'QUEUED',

        reload() {
          assert.ok(true);
          this.set('status', 'SUCCESS');
          return Ember.RSVP.resolve({
            id: '5678',
            jobId: 'abcd',
            status: 'SUCCESS'
          });
        }

      });
      const event = Ember.Object.create({
        hasMany: key => {
          assert.equal(key, 'builds');
          return {
            reload: () => assert.ok(true)
          };
        }
      });
      Ember.run(() => {
        controller.set('model', {
          build,
          event
        });
        controller.reloadBuild();
      });
      await (0, _testHelpers.settled)();
      assert.ok(true);
    });
    (0, _test.default)('it changes build step', function (assert) {
      assert.expect(3);
      const controller = this.owner.lookup('controller:pipeline/build');
      const stub = this.stub(controller, 'transitionToRoute');
      const build = Ember.Object.create({
        id: 5678,
        jobId: 'abcd',
        status: 'RUNNING',
        steps: [{
          startTime: 's',
          name: 'active'
        }]
      });
      const pipeline = Ember.Object.create({
        id: 1
      });
      controller.set('model', {
        build,
        pipeline
      });
      controller.changeBuildStep();
      assert.ok(true);
      assert.ok(stub.calledOnce, 'transition was called once');
      assert.ok(stub.calledWithExactly('pipeline.build.step', 1, 5678, 'active'), 'transition to build step page');
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/build/route-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _test) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/build', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      const route = this.owner.lookup('route:pipeline/build');
      assert.ok(route);
      assert.equal(route.titleToken({
        job: Ember.Object.create({
          name: 'main'
        }),
        build: Ember.Object.create({
          sha: 'abcd1234567890',
          truncatedSha: 'abcd123'
        })
      }), 'main > #abcd123');
    });
    (0, _test.default)('it redirects if build not found', function (assert) {
      const route = this.owner.lookup('route:pipeline/build');
      const stub = this.stub(route, 'transitionTo');
      const jobId = 345;
      const pipelineId = 123;
      const model = {
        pipeline: {
          get: type => type === 'id' ? pipelineId : null
        },
        job: {
          get: type => type === 'id' ? jobId : null
        }
      };
      route.afterModel(model);
      assert.ok(stub.calledOnce, 'transitionTo was called once');
      assert.ok(stub.calledWithExactly('pipeline', pipelineId), 'transition to pipeline');
    });
    (0, _test.default)('it redirects if not step route', function (assert) {
      const route = this.owner.lookup('route:pipeline/build');
      const stub = this.stub(route, 'transitionTo');
      const buildId = 345;
      const pipelineId = 123;
      const transition = {
        targetName: 'pipeline.build.index'
      };
      const model = {
        pipeline: {
          get: type => type === 'id' ? pipelineId : null
        },
        build: {
          get: type => type === 'id' ? buildId : null,
          steps: []
        }
      };
      route.redirect(model, transition);
      model.build.steps = [{
        startTime: 's',
        endTime: 'e',
        name: 'error',
        code: 1
      }];
      route.redirect(model, transition);
      assert.ok(stub.calledOnce, 'transitionTo was called once');
      assert.ok(stub.calledWithExactly('pipeline.build.step', pipelineId, buildId, 'error'), 'transition to build step page');
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/build/step/route-test", ["qunit", "ember-qunit", "ember-sinon-qunit/test-support/test"], function (_qunit, _emberQunit, _test) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/build/step', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      assert.ok(this.owner.lookup('route:pipeline/build/step'));
    });
    (0, _test.default)('it redirects if step is not found in build', function (assert) {
      const route = this.owner.lookup('route:pipeline/build/step');
      const stub = this.stub(route, 'transitionTo');
      const model = {
        event: Ember.Object.create(),
        pipeline: Ember.Object.create({
          id: 1
        }),
        job: Ember.Object.create({
          pipelineId: 1
        }),
        build: Ember.Object.create({
          id: 2,
          steps: [{
            name: 'test'
          }]
        })
      };
      route.afterModel(model);
      assert.ok(stub.calledOnce, 'transitionTo was called once');
      assert.ok(stub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline');
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/events/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender", "sinon"], function (_qunit, _emberQunit, _testHelpers, _pretender, _sinon) {
  "use strict";

  const sessionServiceMock = Ember.Service.extend({
    isAuthenticated: true,
    data: {
      authenticated: {
        // fake token for test, it has { username: apple } inside
        // eslint-disable-next-line max-len
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFwcGxlIiwianRpIjoiNTA1NTQzYTUtNDhjZi00OTAyLWE3YTktZGY0NTI1ODFjYWM0IiwiaWF0IjoxNTIxNTcyMDE5LCJleHAiOjE1MjE1NzU2MTl9.ImS1ajOnksl1X74uL85jOjzdUXmBW3HfMdPfP1vjrmc'
      }
    }
  });
  let server;
  (0, _qunit.module)('Unit | Controller | pipeline/events', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionServiceMock);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      assert.ok(this.owner.lookup('controller:pipeline/events'));
    });
    (0, _qunit.test)('it starts a build', async function (assert) {
      assert.expect(7);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '5678',
        pipelineId: '1234'
      })]);
      const controller = this.owner.lookup('controller:pipeline/events');
      Ember.run(() => {
        controller.set('pipeline', Ember.Object.create({
          id: '1234'
        }));
        controller.set('reload', () => {
          assert.ok(true);
          return Promise.resolve({});
        });
        controller.set('model', {
          events: Ember.Object.create({})
        });

        controller.transitionToRoute = (path, id) => {
          assert.equal(path, 'pipeline');
          assert.equal(id, 1234);
        };

        assert.notOk(controller.get('isShowingModal'));
        controller.send('startMainBuild');
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.notOk(controller.get('isShowingModal'));
      assert.deepEqual(payload, {
        pipelineId: '1234',
        startFrom: '~commit',
        causeMessage: 'Manually started by apple'
      });
    });
    (0, _qunit.test)('it restarts a build', async function (assert) {
      assert.expect(6);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '2'
      })]);
      const controller = this.owner.lookup('controller:pipeline/events');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '123',
            type: 'build',
            attributes: {
              parentBuildId: '345'
            }
          }
        });
        controller.set('selectedEventObj', {
          id: '1',
          sha: 'sha'
        });
        controller.set('pipeline', Ember.Object.create({
          id: '1234'
        }));
        controller.set('reload', () => {
          assert.ok(true);
          return Promise.resolve({});
        });
        controller.set('model', {
          events: Ember.Object.create({})
        });

        controller.transitionToRoute = path => {
          assert.equal(path, 'pipeline/1234/events');
        };

        assert.notOk(controller.get('isShowingModal'));
        controller.send('startDetachedBuild', {
          buildId: '123',
          name: 'deploy'
        });
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.notOk(controller.get('isShowingModal'));
      assert.deepEqual(payload, {
        pipelineId: '1234',
        startFrom: 'deploy',
        buildId: 123,
        parentBuildId: 345,
        parentEventId: 1,
        causeMessage: 'Manually started by apple'
      });
    });
    (0, _qunit.test)('it restarts a PR build', async function (assert) {
      assert.expect(6);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '2'
      })]);
      const controller = this.owner.lookup('controller:pipeline/events');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '123',
            type: 'build',
            attributes: {
              parentBuildId: '345'
            }
          }
        });
        controller.set('selectedEventObj', {
          id: '1',
          sha: 'sha',
          prNum: '3'
        });
        controller.set('pipeline', Ember.Object.create({
          id: '1234'
        }));
        controller.set('activeTab', 'pulls');
        controller.set('reload', () => {
          assert.ok(true);
          return Promise.resolve({});
        });
        controller.set('model', {
          events: Ember.Object.create({})
        });

        controller.transitionToRoute = path => {
          assert.equal(path, 'pipeline/1234/pulls');
        };

        assert.notOk(controller.get('isShowingModal'));
        controller.send('startDetachedBuild', {
          buildId: '123',
          name: 'deploy'
        });
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.notOk(controller.get('isShowingModal'));
      assert.deepEqual(payload, {
        pipelineId: '1234',
        startFrom: 'PR-3:deploy',
        buildId: 123,
        parentBuildId: 345,
        parentEventId: 1,
        causeMessage: 'Manually started by apple'
      });
    });
    (0, _qunit.test)('it stops a build', async function (assert) {
      assert.expect(3);
      server.put('http://localhost:8080/v4/builds/123', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '123'
      })]);
      const controller = this.owner.lookup('controller:pipeline/events');
      const job = {
        hasMany: () => ({
          reload: () => assert.ok(true)
        }),
        buildId: '123',
        name: 'deploy'
      };
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '123',
            type: 'build',
            attributes: {
              status: 'RUNNING'
            }
          }
        });
        controller.set('model', {
          events: Ember.Object.create({})
        });
        const build = controller.store.peekRecord('build', '123');
        build.set('status', 'ABORTED');
        build.save();
        controller.send('stopBuild', job);
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.notOk(controller.get('isShowingModal'));
      assert.deepEqual(payload, {
        status: 'ABORTED'
      });
    });
    (0, _qunit.test)('it starts PR build(s)', async function (assert) {
      const prNum = 999;
      assert.expect(5);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '5679',
        pipelineId: '1234'
      })]);
      const controller = this.owner.lookup('controller:pipeline/events');
      const jobs = [{
        hasMany: () => ({
          reload: () => assert.ok(true)
        })
      }];
      Ember.run(() => {
        controller.set('pipeline', Ember.Object.create({
          id: '1234'
        }));
        controller.set('model', {
          events: Ember.Object.create({})
        });
        assert.notOk(controller.get('isShowingModal'));
        controller.send('startPRBuild', prNum, jobs);
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);
      assert.notOk(controller.get('isShowingModal'));
      assert.deepEqual(payload, {
        causeMessage: 'Manually started by apple',
        pipelineId: '1234',
        startFrom: '~pr',
        prNum
      });
    });
    (0, _qunit.test)('New event comes top of PR list when it starts a PR build with prChain', async function (assert) {
      const prNum = 3;
      const jobs = [{
        hasMany: () => ({
          reload: () => assert.ok(true)
        })
      }];
      assert.expect(5);
      server.post('http://localhost:8080/v4/events', () => [201, {
        'Content-Type': 'application/json'
      }, JSON.stringify({
        id: '2'
      })]);

      const createRecordStub = _sinon.default.stub();

      const controller = this.owner.factoryFor('controller:pipeline/events').create({
        store: {
          createRecord: createRecordStub
        }
      });
      const newEvent = Ember.Object.create({
        id: 3,
        prNum: '3',
        sha: 'sha1',
        save: () => Promise.resolve(),
        get: () => Promise.resolve()
      });
      createRecordStub.returns(newEvent);
      Ember.run(() => {
        const event1 = Ember.Object.create({
          id: '1',
          prNum: '2',
          sha: 'sha1'
        });
        const event2 = Ember.Object.create({
          id: '2',
          prNum: '3',
          sha: 'sha2'
        });
        controller.set('prEvents', Ember.A([event1, event2]));
        controller.set('pipeline', Ember.Object.create({
          id: '1234',
          prChain: true
        }));
        controller.set('model', {
          events: Ember.Object.create({})
        });
        assert.notOk(controller.get('isShowingModal'));
        controller.send('startPRBuild', prNum, jobs);
        assert.ok(controller.get('isShowingModal'));
      });
      await (0, _testHelpers.settled)();
      assert.equal(controller.get('prEvents')[0].id, 3);
      assert.equal(controller.get('prEvents')[0].prNum, '3');
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/events/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/events', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/index');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/index/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/index', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/index');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/metrics/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "sinon", "screwdriver-ui/tests/mock/metrics"], function (_qunit, _emberQunit, _testHelpers, _sinon, _metrics) {
  "use strict";

  let chartMock;
  let metricsMock;
  (0, _qunit.module)('Unit | Controller | pipeline/metrics', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      metricsMock = (0, _metrics.model)();
      chartMock = {
        internal: {
          x: {
            orgDomain: _sinon.default.stub().returns([0, 100])
          },
          subX: {
            orgDomain: _sinon.default.stub().returns([0, 1000])
          },
          hideTooltip: _sinon.default.stub(),
          tooltip: {
            classed: _sinon.default.stub()
          }
        },
        tooltip: {},
        hide: _sinon.default.stub(),
        show: _sinon.default.stub(),
        zoom: _sinon.default.stub()
      };
    });
    (0, _qunit.test)('it exists', function (assert) {
      let controller = this.owner.lookup('controller:pipeline/metrics');
      assert.ok(controller);
    });
    (0, _qunit.test)('it creates chart configurations for events, builds and steps charts', function (assert) {
      let controller = this.owner.lookup('controller:pipeline/metrics');
      Ember.run(() => {
        controller.set('model', metricsMock);
      });
      return (0, _testHelpers.settled)().then(() => {
        assert.ok(controller.get('metrics'));
        assert.deepEqual(controller.get('eventMetrics.columns'), [['total', ...metricsMock.metrics.events.total], ['duration', ...metricsMock.metrics.events.duration], ['imagePullTime', ...metricsMock.metrics.events.imagePullTime], ['queuedTime', ...metricsMock.metrics.events.queuedTime]]);
        assert.equal(controller.get('eventMetrics.hide'), 'total');
        assert.deepEqual(JSON.parse(JSON.stringify(controller.get('eventLegend'))), [{
          key: 'duration',
          name: 'Duration',
          style: {
            string: 'border-color:#16c045 #ea0000 #ea0000 #16c045'
          }
        }, {
          key: 'queuedTime',
          name: 'Queued',
          style: {
            string: 'border-color:#c5c5c5'
          }
        }, {
          key: 'imagePullTime',
          name: 'Image Pull',
          style: {
            string: 'border-color:#dfdfdf'
          }
        }]);
        assert.deepEqual(controller.get('buildMetrics.json'), metricsMock.metrics.builds);
        assert.deepEqual(controller.get('buildMetrics.keys.value'), ['main', 'publish', 'beta', 'prod']);
        assert.deepEqual(JSON.parse(JSON.stringify(controller.get('buildLegend'))), [{
          key: 'main',
          name: 'main',
          style: {
            string: 'border-color:#87d812'
          }
        }, {
          key: 'publish',
          name: 'publish',
          style: {
            string: 'border-color:#fed800'
          }
        }, {
          key: 'beta',
          name: 'beta',
          style: {
            string: 'border-color:#1ac6f4'
          }
        }, {
          key: 'prod',
          name: 'prod',
          style: {
            string: 'border-color:#6e2ebf'
          }
        }]);
        assert.deepEqual(controller.get('stepMetrics.json'), metricsMock.metrics.steps.data);
        assert.deepEqual(controller.get('stepMetrics.keys.value'), ['install', 'install-browsers', 'sd-setup-init', 'sd-setup-launcher', 'sd-setup-scm', 'sd-setup-screwdriver-cache-bookend', 'sd-teardown-screwdriver-artifact-bookend', 'sd-teardown-screwdriver-cache-bookend', 'sd-teardown-screwdriver-coverage-bookend', 'test']);
        assert.deepEqual(JSON.parse(JSON.stringify(controller.get('stepLegend'))), [{
          key: 'install',
          name: 'install',
          style: {
            string: 'border-color:#87d812'
          }
        }, {
          key: 'install-browsers',
          name: 'install-browsers',
          style: {
            string: 'border-color:#fed800'
          }
        }, {
          key: 'sd-setup-init',
          name: 'sd-setup-init',
          style: {
            string: 'border-color:#1ac6f4'
          }
        }, {
          key: 'sd-setup-launcher',
          name: 'sd-setup-launcher',
          style: {
            string: 'border-color:#6e2ebf'
          }
        }, {
          key: 'sd-setup-scm',
          name: 'sd-setup-scm',
          style: {
            string: 'border-color:#1f77b4'
          }
        }, {
          key: 'sd-setup-screwdriver-cache-bookend',
          name: 'sd-setup-screwdriver-cache-bookend',
          style: {
            string: 'border-color:#aec7e8'
          }
        }, {
          key: 'sd-teardown-screwdriver-artifact-bookend',
          name: 'sd-teardown-screwdriver-artifact-bookend',
          style: {
            string: 'border-color:#ff7f0e'
          }
        }, {
          key: 'sd-teardown-screwdriver-cache-bookend',
          name: 'sd-teardown-screwdriver-cache-bookend',
          style: {
            string: 'border-color:#2ca02c'
          }
        }, {
          key: 'sd-teardown-screwdriver-coverage-bookend',
          name: 'sd-teardown-screwdriver-coverage-bookend',
          style: {
            string: 'border-color:#ffbb78'
          }
        }, {
          key: 'test',
          name: 'test',
          style: {
            string: 'border-color:#98df8a'
          }
        }], 'stepLegend');
        assert.ok(controller.get('axis.x'));
        assert.ok(controller.get('axis.y'));
        assert.ok(controller.get('tooltip.contents'));
        assert.ok(controller.get('color.pattern'));
        assert.ok(controller.get('size'));
        assert.ok(controller.get('transition'));
        assert.ok(controller.get('grid'));
        assert.ok(controller.get('bar'));
        assert.notOk(controller.get('legend.show'));
        assert.ok(controller.get('point'));
        assert.ok(controller.get('subchart'));
        assert.ok(controller.get('zoom'));
        assert.ok(controller.get('onInitFns'));
        assert.ok(controller.get('setDates'));
      });
    });
    (0, _qunit.test)('it toggles trendline chart', function (assert) {
      let controller = this.owner.lookup('controller:pipeline/metrics');
      Ember.run(() => {
        controller.set('model', metricsMock);
        controller.set('eventsChart', chartMock);
      });
      return (0, _testHelpers.settled)().then(() => {
        controller.send('toggleTrendlineView', true);
        assert.equal(controller.get('inTrendlineView'), true);
        assert.deepEqual(JSON.parse(JSON.stringify(controller.get('eventLegend'))), [{
          key: 'total',
          name: 'Event Duration',
          style: {
            string: 'border-color:#0066df'
          }
        }], 'eventLegend');
        assert.ok(chartMock.internal.x.orgDomain.called);
        assert.ok(chartMock.show.calledWith('total'));
        assert.ok(chartMock.hide.calledWith(['queuedTime', 'imagePullTime', 'duration']));
        assert.ok(chartMock.zoom.calledWith([0, 100]));
      });
    });
    (0, _qunit.test)('it sets dates, range and job id', function (assert) {
      let controller = this.owner.lookup('controller:pipeline/metrics');
      controller.transitionToRoute = _sinon.default.stub();
      Ember.run(() => {
        controller.set('model', metricsMock);
        controller.set('setDates', _sinon.default.stub());
        controller.set('actions.setJobId', _sinon.default.stub());
        assert.equal(controller.get('selectedRange'), '1wk');
        assert.equal(controller.get('startTime'), metricsMock.startTime);
        assert.equal(controller.get('endTime'), metricsMock.endTime);
        assert.equal(controller.get('selectedJobName'), 'main');
      });
      return (0, _testHelpers.settled)().then(() => {
        const start = new Date();
        const startISO = start.toISOString();
        const end = new Date(start);
        end.setHours(23, 59, 59);
        const endISO = end.toISOString();
        controller.send('setTimeRange', '1mo');
        assert.equal(controller.get('selectedRange'), '1mo');
        controller.send('setCustomRange', [start, end]);
        assert.ok(controller.get('setDates').calledWith(startISO, endISO));
        controller.send('selectJob', 'publish');
        assert.ok(controller.get('actions.setJobId').calledWith('157'));
        assert.ok(controller.transitionToRoute.called);
        controller.send('selectJob', 'do not exist');
        assert.equal(controller.get('errorMessage'), 'Unknown Job: do not exist');
      });
    });
    (0, _qunit.test)('it resets chart zoom level', function (assert) {
      let controller = this.owner.lookup('controller:pipeline/metrics');
      Ember.run(() => {
        controller.set('model', metricsMock);
        controller.set('eventsChart', chartMock);
        controller.set('buildsChart', chartMock);
      });
      return (0, _testHelpers.settled)().then(() => {
        controller.send('resetZoom', 'eventsChart', 'buildsChart', {});
        assert.ok(chartMock.internal.x.orgDomain.calledTwice);
        assert.ok(chartMock.internal.subX.orgDomain.calledTwice);
        assert.ok(chartMock.internal.hideTooltip.calledTwice);
        assert.ok(chartMock.internal.tooltip.classed.calledTwice);
        assert.ok(chartMock.internal.tooltip.classed.calledWith('locked', false));
        assert.ok(chartMock.zoom.calledTwice);
        assert.ok(chartMock.zoom.calledWith([0, 1000]));
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/metrics/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/metrics', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/metrics');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | pipeline', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('pipeline'));
      assert.ok(!!model);
    });
    (0, _qunit.test)('it gets correct appId', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('pipeline'));
      Ember.run(() => {
        const scmRepoMock = {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        };
        model.set('scmRepo', scmRepoMock);
        assert.equal(model.get('appId'), 'foo/bar');
      });
    });
    (0, _qunit.test)('it gets correct hub url', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('pipeline'));
      Ember.run(() => {
        const scmRepoMock = {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        };
        model.set('scmRepo', scmRepoMock);
        assert.equal(model.get('hubUrl'), 'https://github.com/foo/bar');
      });
    });
    (0, _qunit.test)('it gets correct branch', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('pipeline'));
      Ember.run(() => {
        const scmRepoMock = {
          name: 'foo/bar',
          branch: 'master',
          url: 'https://github.com/foo/bar'
        };
        model.set('scmRepo', scmRepoMock);
        assert.equal(model.get('branch'), 'master');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/options/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Controller | pipeline/options', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it handles updating job state', function (assert) {
      server.put('http://localhost:8080/v4/jobs/1234', () => [200, {}, JSON.stringify({
        id: 1234
      })]);
      let controller = this.owner.lookup('controller:pipeline/options');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: '1234',
            type: 'job',
            attributes: {
              status: 'DISABLED'
            }
          }
        });
        controller.send('setJobStatus', '1234', 'ENABLED', 'tkyi', 'testing');
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.equal(payload.state, 'ENABLED');
        assert.equal(payload.stateChanger, 'tkyi');
        assert.equal(payload.stateChangeMessage, 'testing');
      });
    });
    (0, _qunit.test)('it handles deleting pipelines', function (assert) {
      assert.expect(2);
      server.delete('http://localhost:8080/v4/pipelines/abc1234', () => [200, {}, '{"id": "abc1234"}']);
      let controller = this.owner.lookup('controller:pipeline/options');
      Ember.run(() => {
        controller.store.push({
          data: {
            id: 'abc1234',
            type: 'pipeline',
            attributes: {
              state: 'ENABLED'
            }
          }
        });
        controller.set('model', {
          pipeline: controller.store.peekRecord('pipeline', 'abc1234')
        });

        controller.transitionToRoute = route => {
          assert.equal(route, 'home');
        };

        controller.send('removePipeline');
      });
      return (0, _testHelpers.settled)().then(() => {
        assert.ok(true);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/options/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/options', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/options');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/pulls/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/pulls', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/pulls');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      Ember.run(() => {
        // Need this to mock store
        // https://github.com/emberjs/ember-qunit/issues/325
        this.owner.unregister('service:store');
      });
    });
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline');
      assert.ok(route);
      assert.equal(route.titleToken(Ember.Object.create({
        pipeline: Ember.Object.create({
          name: 'foo:bar'
        })
      })), 'foo:bar');
    });
    (0, _qunit.test)('it returns model', function (assert) {
      assert.expect(4);
      const storeStub = Ember.Service.extend({
        findRecord(record, id) {
          assert.ok(id === 1);
          return new Ember.RSVP.Promise(resolve => resolve('pipeline'));
        },

        findAll(record) {
          assert.ok(record === 'collection');
          return new Ember.RSVP.Promise(resolve => resolve('collections'));
        }

      });
      this.owner.register('service:store', storeStub);
      const route = this.owner.lookup('route:pipeline');
      return route.model({
        pipeline_id: 1
      }).then(results => {
        assert.equal(results.pipeline, 'pipeline');
        assert.equal(results.collections, 'collections');
      });
    });
    (0, _qunit.test)('it returns model on collections fetch error', function (assert) {
      assert.expect(4);
      const storeStub = Ember.Service.extend({
        findRecord(record, id) {
          assert.ok(id === 1);
          return new Ember.RSVP.Promise(resolve => resolve('pipeline'));
        },

        findAll(record) {
          assert.ok(record === 'collection');
          return new Ember.RSVP.Promise((resolve, reject) => reject());
        }

      });
      this.owner.register('service:store', storeStub);
      const route = this.owner.lookup('route:pipeline');
      return route.model({
        pipeline_id: 1
      }).then(results => {
        assert.equal(results.pipeline, 'pipeline');
        assert.deepEqual(results.collections, []);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/secrets/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Controller | pipeline/secrets', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it can create secrets', function (assert) {
      server.post('http://localhost:8080/v4/secrets', () => [200, {}, JSON.stringify({
        id: 1234
      })]);
      let controller = this.owner.lookup('controller:pipeline/secrets');
      assert.ok(controller);
      Ember.run(() => {
        controller.set('model', {
          secrets: {
            reload() {
              assert.ok(true);
            }

          }
        });
        controller.send('createSecret', 'batman', 'robin', 'abcd', false);
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          pipelineId: 'abcd',
          name: 'batman',
          value: 'robin',
          allowInPR: false
        });
      });
    });
    (0, _qunit.test)('it can create pipelinetokens', function (assert) {
      server.post('http://localhost:8080/v4/pipelines/1/tokens', () => [200, {}, JSON.stringify({
        id: 123
      })]);
      let controller = this.owner.lookup('controller:pipeline/secrets');
      assert.ok(controller);
      Ember.run(() => {
        controller.set('model', {
          tokens: {
            reload() {
              assert.ok(true);
            }

          },
          pipeline: {
            id: '1'
          }
        });
        controller.send('createPipelineToken', 'foo', 'bar');
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          name: 'foo',
          description: 'bar'
        });
      });
    });
    (0, _qunit.test)('it shows errors from server', function (assert) {
      server.post('http://localhost:8080/v4/secrets', () => [400, {}, JSON.stringify({
        statusCode: 400,
        error: 'unfortunate',
        message: 'a series of unfortunate events'
      })]);
      let controller = this.owner.lookup('controller:pipeline/secrets');
      assert.ok(controller);
      Ember.run(() => {
        assert.equal(controller.get('errorMessage'), '');
        controller.send('createSecret', 'batman', 'robin', 'abcd', false);
      });
      return (0, _testHelpers.settled)().then(() => {
        assert.equal(controller.get('errorMessage'), 'a series of unfortunate events');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/secrets/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | pipeline/secrets', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:pipeline/secrets');
      assert.ok(route);
      assert.equal(route.titleToken, 'Secrets');
    });
  });
});
define("screwdriver-ui/tests/unit/pipeline/serializer-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | pipeline', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it serializes records', function (assert) {
      let record = Ember.run(() => this.owner.lookup('service:store').createRecord('pipeline'));
      let serializedRecord = record.serialize();
      assert.ok(serializedRecord);
    });
    (0, _qunit.test)('it does not post with model name as key', function (assert) {
      assert.expect(2);
      server.post('http://localhost:8080/v4/pipelines', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd'
        })];
      });
      Ember.run(() => {
        const pipeline = this.owner.lookup('service:store').createRecord('pipeline', {
          checkoutUrl: 'git@example.com:foo/bar.git'
        });
        pipeline.save().then(() => {
          assert.equal(pipeline.get('id'), 'abcd');
        });
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          checkoutUrl: 'git@example.com:foo/bar.git',
          rootDir: ''
        });
      });
    });
  });
});
define("screwdriver-ui/tests/unit/pr-events/service-test", ["pretender", "qunit", "ember-qunit"], function (_pretender, _qunit, _emberQunit) {
  "use strict";

  let server;

  const initServer = () => {
    server.get('http://localhost:8080/v4/pipelines/12345/events', () => [200, {
      'Content-Type': 'application/json'
    }, JSON.stringify([{
      id: 'abcd',
      causeMessage: 'Merged by batman',
      commit: {
        message: 'Merge pull request #2 from batcave/batmobile',
        author: {
          username: 'batman',
          name: 'Bruce W',
          avatar: 'http://example.com/u/batman/avatar',
          url: 'http://example.com/u/batman'
        },
        url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
      },
      truncatedMessage: 'Merge it',
      createTime: '2016-11-04T20:09:41.238Z',
      creator: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      pr: {
        url: 'https://github.com/screwdriver-cd/ui/pull/292'
      },
      pipelineId: '12345',
      sha: 'abcdef1029384',
      truncatedSha: 'abcdef',
      type: 'pr',
      workflow: ['main', 'publish'],
      builds: ['build1', 'build2']
    }])]);
    server.get('http://localhost:8080/v4/jobs/2/builds', () => [200, {
      'Content-Type': 'application/json'
    }, JSON.stringify([{
      eventId: 'abcd',
      id: '2'
    }])]);
  };

  const sessionServiceMock = Ember.Service.extend({
    isAuthenticated: true,
    data: {
      authenticated: {
        token: 'banana'
      }
    }
  });
  (0, _qunit.module)('Unit | Service | pr events', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionServiceMock);
      this.session = this.owner.lookup('service:session');
      this.session.set('isAuthenticated', true);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:pr-events');
      assert.ok(service);
    });
    (0, _qunit.test)('it fetches events with type pr', function (assert) {
      initServer();
      assert.expect(3);
      const service = this.owner.lookup('service:pr-events');
      const b = service.getPRevents(12345, 'https://github.com/screwdriver-cd/ui/pull/292', 2);
      b.then(pair => {
        assert.equal(pair[0].event.id, 'abcd');
        assert.equal(pair[0].build.eventId, 'abcd');
        assert.equal(pair[0].build.id, 2);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/search/controller-test", ["qunit", "ember-qunit", "screwdriver-ui/tests/helpers/inject-session"], function (_qunit, _emberQunit, _injectSession) {
  "use strict";

  (0, _qunit.module)('Unit | Controller | search', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:search');
      assert.ok(controller);
    });
    (0, _qunit.test)('it calls updatePipelines', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:search');
      const pipelineModelMockArray = [Ember.Object.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }), Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      controller.set('store', {
        query(modelName, params) {
          assert.strictEqual(modelName, 'pipeline');
          assert.deepEqual(params, {
            page: 2,
            count: 3,
            sortBy: 'name',
            sort: 'ascending'
          });
          return Ember.RSVP.resolve(pipelineModelMockArray);
        }

      });
      controller.send('updatePipelines', {
        page: 2
      });
    });
    (0, _qunit.test)('it calls updatePipelines with search param', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:search');
      const pipelineModelMockArray = [Ember.Object.create({
        id: 2,
        appId: 'batman/tumbler',
        branch: 'waynecorp',
        scmContext: 'bitbucket:bitbucket.org'
      }), Ember.Object.create({
        id: 1,
        appId: 'foo/bar',
        branch: 'master',
        scmContext: 'github:github.com'
      })];
      controller.set('store', {
        query(modelName, params) {
          assert.strictEqual(modelName, 'pipeline');
          assert.deepEqual(params, {
            page: 2,
            count: 3,
            sortBy: 'name',
            sort: 'ascending',
            search: 'ba'
          });
          return Ember.RSVP.resolve(pipelineModelMockArray);
        }

      });
      controller.send('updatePipelines', {
        page: 2,
        search: 'ba'
      });
    });
    (0, _qunit.test)('it calls addToCollection', function (assert) {
      (0, _injectSession.default)(this);
      const controller = this.owner.lookup('controller:search');
      let pipelineIds = [1, 2];
      const collectionModelMock = {
        id: 1,
        name: 'collection1',
        description: 'description1',
        pipelineIds,

        get(field) {
          assert.strictEqual(field, 'pipelineIds'); // The collection currently has pipelineIds 1 and 2

          return pipelineIds;
        },

        set(field, value) {
          assert.strictEqual(field, 'pipelineIds');
          assert.deepEqual(value, [1, 2, 3]);
          pipelineIds = value;
        },

        save() {
          assert.deepEqual(pipelineIds, [1, 2, 3]);
          return Ember.RSVP.resolve({
            id: 1,
            name: 'collection1',
            description: 'description1',
            pipelineIds: [1, 2, 3]
          });
        }

      };
      controller.set('store', {
        findRecord(modelName, collectionId) {
          assert.strictEqual(modelName, 'collection');
          assert.strictEqual(collectionId, 1);
          return Ember.RSVP.resolve(collectionModelMock);
        }

      }); // Add pipeline with id 3 to collection with id 1

      controller.send('addToCollection', 3, 1);
    });
  });
});
define("screwdriver-ui/tests/unit/search/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | search', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      Ember.run(() => {
        // Need this to mock store
        // https://github.com/emberjs/ember-qunit/issues/325
        this.owner.unregister('service:store');
      });
    });
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:search');
      assert.ok(route);
      assert.equal(route.titleToken, 'Search');
    });
    (0, _qunit.test)('it returns model even on collections fetch error', function (assert) {
      assert.expect(5);
      const storeStub = Ember.Service.extend({
        query(record, conf) {
          assert.ok(conf.page === 1);
          assert.ok(conf.search === 'search');
          return new Ember.RSVP.Promise(resolve => resolve('results'));
        },

        findAll(record) {
          assert.ok(record === 'collection');
          return new Ember.RSVP.Promise((resolve, reject) => reject());
        }

      });
      this.owner.register('service:store', storeStub);
      const route = this.owner.lookup('route:search');
      return route.model({
        query: 'search'
      }).then(results => {
        assert.equal(results.pipelines, 'results');
        assert.deepEqual(results.collections, []);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/secret/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | secret', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('secret')); // let store = this.store();

      assert.ok(!!model);
    });
  });
});
define("screwdriver-ui/tests/unit/secret/serializer-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | secret', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    }); // Replace this with your real tests.

    (0, _qunit.test)('it serializes records', function (assert) {
      let record = Ember.run(() => this.owner.lookup('service:store').createRecord('secret'));
      let serializedRecord = record.serialize();
      assert.ok(serializedRecord);
    });
    (0, _qunit.test)('it does not post with model name as key', function (assert) {
      assert.expect(2);
      server.post('http://localhost:8080/v4/secrets', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd'
        })];
      });
      Ember.run(() => {
        const secret = this.owner.lookup('service:store').createRecord('secret', {
          pipelineId: 'aabb',
          name: 'foo',
          value: 'bar'
        });
        secret.save().then(() => {
          assert.equal(secret.get('id'), 'abcd');
        });
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          pipelineId: 'aabb',
          name: 'foo',
          value: 'bar',
          allowInPR: false
        });
      });
    });
    (0, _qunit.test)('it serializes only dirty fields', function (assert) {
      assert.expect(1);
      server.put('http://localhost:8080/v4/secrets/abcd', function () {
        return [200, {}, JSON.stringify({
          id: 'abcd'
        })];
      });
      Ember.run(() => {
        this.owner.lookup('service:store').push({
          data: {
            id: 'abcd',
            type: 'secret',
            attributes: {
              pipelineId: 'aabb',
              name: 'foo',
              value: 'bar',
              allowInPR: false
            }
          }
        });
        const secret = this.owner.lookup('service:store').peekRecord('secret', 'abcd');
        secret.set('value', 'newValue');
        secret.save();
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          value: 'newValue'
        });
      });
    });
  });
});
define("screwdriver-ui/tests/unit/store/service-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Service | store', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Replace this with your real tests.

    (0, _qunit.test)('it exists', function (assert) {
      let service = this.owner.lookup('service:store');
      assert.ok(service);
    });
  });
});
define("screwdriver-ui/tests/unit/sync/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  let server;

  const sync = () => {
    server.post('http://localhost:8080/v4/pipelines/1/sync/', () => [204]);
  };

  const syncWithPath = () => {
    server.post('http://localhost:8080/v4/pipelines/1/sync/webhooks', () => [204]);
  };

  const syncFailed = () => {
    server.post('http://localhost:8080/v4/pipelines/1/sync/', () => [409, {
      'Content-Type': 'application/json'
    }, JSON.stringify({
      statusCode: 409,
      error: 'Conflict',
      message: 'something conflicting'
    })]);
  };

  (0, _qunit.module)('Unit | Service | sync', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it exists', function (assert) {
      const service = this.owner.lookup('service:sync');
      assert.ok(service);
    });
    (0, _qunit.test)('it makes a call to sync successfully without passing syncPath', function (assert) {
      assert.expect(1);
      sync();
      const service = this.owner.lookup('service:sync');
      const p = service.syncRequests(1, undefined);
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/');
      });
    });
    (0, _qunit.test)('it makes a call to sync successfully with syncPath', function (assert) {
      assert.expect(1);
      syncWithPath();
      const service = this.owner.lookup('service:sync');
      const p = service.syncRequests(1, 'webhooks');
      p.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/webhooks');
      });
    });
    (0, _qunit.test)('it fails to sync and rejects with error message ', function (assert) {
      assert.expect(2);
      syncFailed();
      const service = this.owner.lookup('service:sync');
      const p = service.syncRequests(1, undefined);
      p.catch(error => {
        assert.equal(error, 'something conflicting');
        const [request] = server.handledRequests;
        assert.equal(request.url, 'http://localhost:8080/v4/pipelines/1/sync/');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/template/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  const sessionStub = Ember.Service.extend({
    data: {
      authenticated: {
        token: 'faketoken'
      }
    }
  });
  const createTime = '2016-09-23T16:53:00.274Z';
  const created = new Date(createTime).getTime();
  const lastUpdated = "".concat(humanizeDuration(Date.now() - created, {
    round: true,
    largest: 1
  }), " ago");
  let server;
  (0, _qunit.module)('Unit | Service | template', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:foo']

    hooks.beforeEach(function () {
      server = new _pretender.default();
      this.owner.register('service:session', sessionStub);
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it fetches one set of template versions', function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/templates/foo%2Fbar', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 2,
        namespace: 'foo',
        name: 'bar',
        version: '2.0.0',
        createTime
      }, {
        id: 1,
        namespace: 'foo',
        name: 'bar',
        version: '1.0.0',
        createTime
      }])]);
      let service = this.owner.lookup('service:template');
      assert.ok(service);
      const t = service.getOneTemplate('foo/bar');
      t.then(templates => {
        /* eslint-disable max-len */
        assert.deepEqual(templates, [{
          id: 2,
          fullName: 'foo/bar',
          namespace: 'foo',
          name: 'bar',
          version: '2.0.0',
          createTime,
          lastUpdated
        }, {
          id: 1,
          fullName: 'foo/bar',
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          createTime,
          lastUpdated
        }]);
        /* eslint-enable max-len */
      });
    });
    (0, _qunit.test)('it fetches all templates', function (assert) {
      assert.expect(2);
      server.get('http://localhost:8080/v4/templates', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify([{
        id: 3,
        namespace: 'boo',
        name: 'baz',
        version: '2.0.0',
        createTime
      }, {
        id: 2,
        namespace: 'foo',
        name: 'baz',
        version: '2.0.0',
        createTime
      }, {
        id: 1,
        namespace: 'foo',
        name: 'bar',
        version: '1.0.0',
        createTime
      }])]);
      let service = this.owner.lookup('service:template');
      assert.ok(service);
      const t = service.getAllTemplates();
      t.then(templates => {
        assert.deepEqual(templates, [
        /* eslint-disable max-len */
        {
          id: 3,
          fullName: 'boo/baz',
          namespace: 'boo',
          name: 'baz',
          version: '2.0.0',
          createTime,
          lastUpdated
        }, {
          id: 2,
          fullName: 'foo/baz',
          namespace: 'foo',
          name: 'baz',
          version: '2.0.0',
          createTime,
          lastUpdated
        }, {
          id: 1,
          fullName: 'foo/bar',
          namespace: 'foo',
          name: 'bar',
          version: '1.0.0',
          createTime,
          lastUpdated
        }]);
        /* eslint-enable max-len */
      });
    });
    (0, _qunit.test)('it deletes all versions of a template', function (assert) {
      assert.expect(4);
      server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [204]);
      let service = this.owner.lookup('service:template');
      assert.ok(service);
      const t = service.deleteTemplates('foo/bar');
      t.then(() => {
        const [request] = server.handledRequests;
        assert.equal(request.status, '204');
        assert.equal(request.method, 'DELETE');
        assert.equal(request.url, 'http://localhost:8080/v4/templates/foo%2Fbar');
      });
    });
    (0, _qunit.test)('it returns 401 on unauthorized deletion', function (assert) {
      assert.expect(2);
      server.delete('http://localhost:8080/v4/templates/foo%2Fbar', () => [401, {
        'Content-Type': 'application/json'
      }, 'Unauthorized']);
      let service = this.owner.lookup('service:template');
      assert.ok(service);
      const t = service.deleteTemplates('foo/bar');
      t.then(() => {}, err => {
        assert.equal(err, 'You do not have the permissions to remove this template.');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/templates/detail/controller-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const templateServiceStub = Ember.Service.extend({
    deleteTemplates() {
      return Ember.RSVP.resolve([204]);
    }

  });
  (0, _qunit.module)('Unit | Controller | templates/detail', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:template', templateServiceStub);
    });
    (0, _qunit.test)('it parses model properly', function (assert) {
      let controller = this.owner.lookup('controller:templates/detail');
      controller.set('model', [{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('latest.id'), 3);
      assert.equal(controller.get('versionTemplate.id'), 3);
    });
    (0, _qunit.test)('it handles version changes', function (assert) {
      let controller = this.owner.lookup('controller:templates/detail');
      controller.set('model', [{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('latest.id'), 3);
      assert.equal(controller.get('versionTemplate.id'), 3);
      controller.send('changeVersion', '1.0.0');
      assert.equal(controller.get('selectedVersion'), '1.0.0');
      assert.equal(controller.get('versionTemplate.id'), 1);
      assert.equal(controller.get('latest.id'), 3);
    });
    (0, _qunit.test)('it handles model changes', function (assert) {
      let controller = this.owner.lookup('controller:templates/detail'); // eslint-disable-next-line new-cap

      const arr = Ember.A([{
        id: 3,
        version: '3.0.0'
      }, {
        id: 2,
        version: '2.0.0'
      }, {
        id: 1,
        version: '1.0.0'
      }]);
      controller.set('model', arr);
      assert.ok(controller);
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('versionTemplate.id'), 3);
      assert.equal(controller.get('latest.id'), 3);
      controller.send('changeVersion', '1.0.0');
      assert.equal(controller.get('selectedVersion'), '1.0.0');
      assert.equal(controller.get('versionTemplate.id'), 1);
      arr.unshiftObject({
        id: 4,
        version: '4.0.0'
      });
      assert.equal(controller.get('selectedVersion'), null);
      assert.equal(controller.get('versionTemplate.id'), 4);
      assert.equal(controller.get('latest.id'), 4);
    });
    (0, _qunit.test)('it handles template deletion', function (assert) {
      let controller = this.owner.lookup('controller:templates/detail'); // eslint-disable-next-line new-cap

      const arr = Ember.A([{
        id: 3,
        name: 'sample',
        version: '3.0.0'
      }, {
        id: 2,
        name: 'sample',
        version: '2.0.0'
      }, {
        id: 1,
        name: 'sample',
        version: '1.0.0'
      }]);
      controller.set('model', arr);
      assert.ok(controller);

      controller.transitionToRoute = route => {
        assert.equal(route, 'templates');
      };

      controller.send('removeTemplate', 'sample');
    });
  });
});
define("screwdriver-ui/tests/unit/templates/detail/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const templateServiceStub = Ember.Service.extend({
    getOneTemplate() {
      return Ember.RSVP.resolve([{
        id: 3,
        name: 'baz',
        version: '3.0.0',
        namespace: 'foo'
      }, {
        id: 2,
        name: 'baz',
        version: '2.0.0',
        namespace: 'foo'
      }, {
        id: 1,
        name: 'baz',
        version: '1.0.0',
        namespace: 'foo'
      }, {
        id: 6,
        name: 'baz',
        version: '3.0.0',
        namespace: 'bar'
      }, {
        id: 5,
        name: 'baz',
        version: '2.0.0',
        namespace: 'bar'
      }, {
        id: 4,
        name: 'baz',
        version: '1.0.0',
        namespace: 'bar'
      }]);
    },

    getTemplateTags(namespace, name) {
      return Ember.RSVP.resolve([{
        id: 5,
        name,
        version: '3.0.0',
        tag: 'latest'
      }, {
        id: 6,
        name,
        version: '3.0.0',
        tag: 'stable'
      }, {
        id: 7,
        name,
        version: '2.0.0',
        tag: 'meeseeks'
      }]);
    }

  });
  (0, _qunit.module)('Unit | Route | templates/detail', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:template', templateServiceStub);
    });
    (0, _qunit.test)('it asks for the list of templates for a given name', function (assert) {
      let route = this.owner.lookup('route:templates/detail');
      assert.ok(route);
      return route.model({
        namespace: 'foo',
        name: 'baz'
      }).then(templates => {
        assert.equal(templates.length, 3);
        assert.equal(templates[0].namespace, 'foo');
        assert.equal(templates[0].name, 'baz');
      });
    });
  });
});
define("screwdriver-ui/tests/unit/templates/index/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  const templateServiceStub = Ember.Service.extend({
    getAllTemplates() {
      return Ember.RSVP.resolve([{
        id: 3,
        name: 'foo/bar',
        version: '3.0.0'
      }, {
        id: 2,
        name: 'foo/baz',
        version: '2.0.0'
      }, {
        id: 1,
        name: 'bar/baz',
        version: '1.0.0'
      }]);
    }

  });
  (0, _qunit.module)('Unit | Route | templates/index', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['controller:foo']

    hooks.beforeEach(function beforeEach() {
      this.owner.register('service:template', templateServiceStub);
    });
    (0, _qunit.test)('it dedupes the templates by name', function (assert) {
      let route = this.owner.lookup('route:templates/index');
      assert.ok(route);
      return route.model().then(templates => {
        assert.equal(templates.length, 3);
      });
    });
  });
});
define("screwdriver-ui/tests/unit/templates/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | templates', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let route = this.owner.lookup('route:templates');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/token/model-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Model | token', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      let model = Ember.run(() => this.owner.lookup('service:store').createRecord('token')); // let store = this.store();

      assert.ok(!!model);
    });
  });
});
define("screwdriver-ui/tests/unit/token/serializer-test", ["qunit", "ember-qunit", "@ember/test-helpers", "pretender"], function (_qunit, _emberQunit, _testHelpers, _pretender) {
  "use strict";

  let server;
  (0, _qunit.module)('Unit | Serializer | token', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    hooks.beforeEach(function () {
      server = new _pretender.default();
    });
    hooks.afterEach(function () {
      server.shutdown();
    }); // Replace this with your real tests.

    (0, _qunit.test)('it serializes records', function (assert) {
      let record = Ember.run(() => this.owner.lookup('service:store').createRecord('token'));
      let serializedRecord = record.serialize();
      assert.ok(serializedRecord);
    });
    (0, _qunit.test)('it does not post with model name as key', function (assert) {
      assert.expect(2);
      server.post('http://localhost:8080/v4/tokens', function () {
        return [200, {}, JSON.stringify({
          id: 1234
        })];
      });
      Ember.run(() => {
        const token = this.owner.lookup('service:store').createRecord('token', {
          name: 'foo',
          description: 'bar'
        });
        token.save().then(() => {
          assert.equal(token.get('id'), 1234);
        });
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          name: 'foo',
          description: 'bar'
        });
      });
    });
    (0, _qunit.test)('it serializes only dirty fields', function (assert) {
      assert.expect(1);
      server.put('http://localhost:8080/v4/tokens/1234', function () {
        return [200, {}, JSON.stringify({
          id: 1234
        })];
      });
      Ember.run(() => {
        this.owner.lookup('service:store').push({
          data: {
            id: 1234,
            type: 'token',
            attributes: {
              name: 'foo',
              description: 'bar'
            }
          }
        });
        const token = this.owner.lookup('service:store').peekRecord('token', 1234);
        token.set('description', 'newDescription');
        token.save();
      });
      return (0, _testHelpers.settled)().then(() => {
        const [request] = server.handledRequests;
        const payload = JSON.parse(request.requestBody);
        assert.deepEqual(payload, {
          description: 'newDescription'
        });
      });
    });
  });
});
define("screwdriver-ui/tests/unit/utils/build-test", ["screwdriver-ui/utils/build", "qunit"], function (_build, _qunit) {
  "use strict";

  const {
    isActiveBuild,
    isPRJob,
    statusIcon
  } = _build.default;
  (0, _qunit.module)('Unit | Utility | build', function () {
    (0, _qunit.test)('it checks if the current build is active', assert => {
      let result = isActiveBuild('QUEUED', '2017-01-05T00:55:46.775Z');
      assert.ok(result);
      result = isActiveBuild('RUNNING', '2017-01-05T00:55:46.775Z');
      assert.ok(result);
      result = isActiveBuild('BLOCKED', '2017-01-05T00:55:46.775Z');
      assert.ok(result);
      result = isActiveBuild('UNSTABLE');
      assert.ok(result);
      result = isActiveBuild('UNSTABLE', '2017-01-05T00:55:46.775Z');
      assert.notOk(result);
      result = isActiveBuild('CREATED');
      assert.notOk(result);
    });
    (0, _qunit.test)('it checks if the current job is a PR job', assert => {
      let result = isPRJob('main');
      assert.notOk(result);
      result = isPRJob('PR-1:main');
      assert.ok(result);
    });
    (0, _qunit.test)('it gets the right fs class name for given status', assert => {
      assert.equal(statusIcon('SUCCESS', true), 'check-circle-o');
      assert.equal(statusIcon('SUCCESS'), 'check-circle');
      assert.equal(statusIcon('CREATED', true), 'check-circle-o');
      assert.equal(statusIcon('CREATED'), 'check-circle');
      assert.equal(statusIcon('RUNNING'), 'spinner fa-spin');
      assert.equal(statusIcon('QUEUED'), 'spinner fa-spin');
      assert.equal(statusIcon('UNSTABLE'), 'exclamation-circle');
      assert.equal(statusIcon('FAILURE', true), 'times-circle-o');
      assert.equal(statusIcon('FAILURE'), 'times-circle');
      assert.equal(statusIcon(), 'circle-o');
    });
  });
});
define("screwdriver-ui/tests/unit/utils/git-test", ["screwdriver-ui/utils/git", "qunit"], function (_git, _qunit) {
  "use strict";

  (0, _qunit.module)('Unit | Utility | git', function () {
    (0, _qunit.test)('it parses the checkout URL correctly', assert => {
      let result = _git.default.parse('bananas');

      assert.notOk(result.valid);
      result = _git.default.parse('git@github.com:bananas/peel.git');
      assert.deepEqual(result, {
        server: 'github.com',
        owner: 'bananas',
        repo: 'peel',
        branch: 'master',
        valid: true
      });
      result = _git.default.parse('git@github.com:bananas/peel.git#tree');
      assert.deepEqual(result, {
        server: 'github.com',
        owner: 'bananas',
        repo: 'peel',
        branch: 'tree',
        valid: true
      });
    });
    (0, _qunit.test)('it generates the checkout URL correctly', assert => {
      let result = _git.default.getCheckoutUrl({
        appId: 'bananas/peel',
        scmUri: 'github.com:12345:master'
      });

      assert.strictEqual(result, 'git@github.com:bananas/peel.git#master');
    });
  });
});
define("screwdriver-ui/tests/unit/utils/graph-tools-test", ["screwdriver-ui/utils/graph-tools", "qunit"], function (_graphTools, _qunit) {
  "use strict";

  const SIMPLE_GRAPH = {
    nodes: [{
      name: '~pr'
    }, {
      name: '~commit'
    }, {
      name: 'main'
    }],
    edges: [{
      src: '~pr',
      dest: 'main'
    }, {
      src: '~commit',
      dest: 'main'
    }]
  };
  const COMPLEX_GRAPH = {
    nodes: [{
      name: '~pr'
    }, {
      name: '~commit'
    }, {
      name: 'main',
      id: 1
    }, {
      name: 'A',
      id: 2
    }, {
      name: 'B',
      id: 3
    }, {
      name: 'C',
      id: 4
    }, {
      name: 'D',
      id: 5
    }],
    edges: [{
      src: '~pr',
      dest: 'main'
    }, {
      src: '~commit',
      dest: 'main'
    }, {
      src: 'main',
      dest: 'A'
    }, {
      src: 'main',
      dest: 'B'
    }, {
      src: 'A',
      dest: 'C'
    }, {
      src: 'B',
      dest: 'D'
    }, {
      src: 'C',
      dest: 'D'
    }]
  };
  const MORE_COMPLEX_GRAPH = {
    nodes: [{
      name: '~pr'
    }, {
      name: '~commit'
    }, {
      name: 'no_main'
    }, {
      name: '~sd@241:main'
    }, {
      name: 'publish'
    }, {
      name: 'other_publish'
    }, {
      name: 'wow_new_main'
    }, {
      name: 'detached_main'
    }, {
      name: 'after_detached_main'
    }, {
      name: 'detached_solo'
    }],
    edges: [{
      src: '~commit',
      dest: 'no_main'
    }, {
      src: '~pr',
      dest: 'no_main'
    }, {
      src: '~sd@241:main',
      dest: 'no_main'
    }, {
      src: 'no_main',
      dest: 'publish'
    }, {
      src: 'wow_new_main',
      dest: 'other_publish'
    }, {
      src: '~commit',
      dest: 'wow_new_main'
    }, {
      src: '~pr',
      dest: 'wow_new_main'
    }, {
      src: '~sd@241:main',
      dest: 'wow_new_main'
    }, {
      src: 'detached_main',
      dest: 'after_detached_main'
    }]
  };
  (0, _qunit.module)('Unit | Utility | graph tools', function () {
    (0, _qunit.test)('it gets the right icons', function (assert) {
      assert.equal((0, _graphTools.icon)('SUCCESS'), '\ue903');
      assert.equal((0, _graphTools.icon)('banana'), '\ue901');
    });
    (0, _qunit.test)('it gets an element from a list', function (assert) {
      const list = [{
        name: 'foo'
      }, {
        name: 'bar'
      }];
      const result = (0, _graphTools.node)(list, 'bar');
      assert.deepEqual(result, {
        name: 'bar'
      });
    });
    (0, _qunit.test)('it processes a simple graph without builds', function (assert) {
      const expectedOutput = {
        nodes: [{
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        }, {
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        }, {
          name: 'main',
          pos: {
            x: 1,
            y: 0
          }
        }],
        edges: [{
          src: '~pr',
          dest: 'main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~commit',
          dest: 'main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 0
          }
        }],
        meta: {
          height: 2,
          width: 2
        }
      };
      const result = (0, _graphTools.decorateGraph)({
        inputGraph: SIMPLE_GRAPH
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it processes a more complex graph without builds', function (assert) {
      const expectedOutput = {
        nodes: [{
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        }, {
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        }, {
          name: 'main',
          id: 1,
          pos: {
            x: 1,
            y: 0
          }
        }, {
          name: 'A',
          id: 2,
          pos: {
            x: 2,
            y: 0
          }
        }, {
          name: 'B',
          id: 3,
          pos: {
            x: 2,
            y: 1
          }
        }, {
          name: 'C',
          id: 4,
          pos: {
            x: 3,
            y: 0
          }
        }, {
          name: 'D',
          id: 5,
          pos: {
            x: 4,
            y: 0
          }
        }],
        edges: [{
          src: '~pr',
          dest: 'main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~commit',
          dest: 'main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: 'main',
          dest: 'A',
          from: {
            x: 1,
            y: 0
          },
          to: {
            x: 2,
            y: 0
          }
        }, {
          src: 'main',
          dest: 'B',
          from: {
            x: 1,
            y: 0
          },
          to: {
            x: 2,
            y: 1
          }
        }, {
          src: 'A',
          dest: 'C',
          from: {
            x: 2,
            y: 0
          },
          to: {
            x: 3,
            y: 0
          }
        }, {
          src: 'B',
          dest: 'D',
          from: {
            x: 2,
            y: 1
          },
          to: {
            x: 4,
            y: 0
          }
        }, {
          src: 'C',
          dest: 'D',
          from: {
            x: 3,
            y: 0
          },
          to: {
            x: 4,
            y: 0
          }
        }],
        meta: {
          height: 2,
          width: 5
        }
      };
      const result = (0, _graphTools.decorateGraph)({
        inputGraph: COMPLEX_GRAPH
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it processes a complex graph with builds', function (assert) {
      const builds = [{
        jobId: 1,
        status: 'SUCCESS',
        id: 6
      }, {
        jobId: 2,
        status: 'SUCCESS',
        id: 7
      }, {
        jobId: 3,
        status: 'SUCCESS',
        id: 8
      }, {
        jobId: 4,
        status: 'SUCCESS',
        id: 9
      }, {
        jobId: 5,
        status: 'FAILURE',
        id: 10
      }];
      const expectedOutput = {
        nodes: [{
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        }, {
          name: '~commit',
          status: 'STARTED_FROM',
          pos: {
            x: 0,
            y: 1
          }
        }, {
          name: 'main',
          id: 1,
          buildId: 6,
          status: 'SUCCESS',
          pos: {
            x: 1,
            y: 0
          }
        }, {
          name: 'A',
          id: 2,
          buildId: 7,
          status: 'SUCCESS',
          pos: {
            x: 2,
            y: 0
          }
        }, {
          name: 'B',
          id: 3,
          buildId: 8,
          status: 'SUCCESS',
          pos: {
            x: 2,
            y: 1
          }
        }, {
          name: 'C',
          id: 4,
          buildId: 9,
          status: 'SUCCESS',
          pos: {
            x: 3,
            y: 0
          }
        }, {
          name: 'D',
          id: 5,
          buildId: 10,
          status: 'FAILURE',
          pos: {
            x: 4,
            y: 0
          }
        }],
        edges: [{
          src: '~pr',
          dest: 'main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~commit',
          dest: 'main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 0
          },
          status: 'STARTED_FROM'
        }, {
          src: 'main',
          dest: 'A',
          from: {
            x: 1,
            y: 0
          },
          to: {
            x: 2,
            y: 0
          },
          status: 'SUCCESS'
        }, {
          src: 'main',
          dest: 'B',
          from: {
            x: 1,
            y: 0
          },
          to: {
            x: 2,
            y: 1
          },
          status: 'SUCCESS'
        }, {
          src: 'A',
          dest: 'C',
          from: {
            x: 2,
            y: 0
          },
          to: {
            x: 3,
            y: 0
          },
          status: 'SUCCESS'
        }, {
          src: 'B',
          dest: 'D',
          from: {
            x: 2,
            y: 1
          },
          to: {
            x: 4,
            y: 0
          },
          status: 'SUCCESS'
        }, {
          src: 'C',
          dest: 'D',
          from: {
            x: 3,
            y: 0
          },
          to: {
            x: 4,
            y: 0
          },
          status: 'SUCCESS'
        }],
        meta: {
          height: 2,
          width: 5
        }
      };
      const result = (0, _graphTools.decorateGraph)({
        inputGraph: COMPLEX_GRAPH,
        builds,
        start: '~commit'
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it handles detached jobs', function (assert) {
      const inputGraph = {
        nodes: [{
          name: '~pr'
        }, {
          name: '~commit'
        }, {
          name: 'main'
        }, {
          name: 'foo'
        }, {
          name: 'bar'
        }],
        edges: [{
          src: '~pr',
          dest: 'main'
        }, {
          src: '~commit',
          dest: 'main'
        }]
      };
      const expectedOutput = {
        nodes: [{
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        }, {
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        }, {
          name: 'main',
          pos: {
            x: 1,
            y: 0
          }
        }, {
          name: 'foo',
          pos: {
            x: 0,
            y: 2
          }
        }, {
          name: 'bar',
          pos: {
            x: 0,
            y: 3
          }
        }],
        edges: [{
          src: '~pr',
          dest: 'main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~commit',
          dest: 'main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 0
          }
        }],
        meta: {
          height: 4,
          width: 2
        }
      };
      const result = (0, _graphTools.decorateGraph)({
        inputGraph
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it handles complex misordered pipeline with multiple commit/pr/remote triggers', function (assert) {
      const expectedOutput = {
        nodes: [{
          name: '~pr',
          pos: {
            x: 0,
            y: 0
          }
        }, {
          name: '~commit',
          pos: {
            x: 0,
            y: 1
          }
        }, {
          name: 'no_main',
          pos: {
            x: 1,
            y: 0
          }
        }, {
          name: '~sd@241:main',
          pos: {
            x: 0,
            y: 2
          }
        }, {
          name: 'publish',
          pos: {
            x: 2,
            y: 0
          }
        }, {
          name: 'other_publish',
          pos: {
            x: 2,
            y: 1
          }
        }, {
          name: 'wow_new_main',
          pos: {
            x: 1,
            y: 1
          }
        }, {
          name: 'detached_main',
          pos: {
            x: 0,
            y: 3
          }
        }, {
          name: 'after_detached_main',
          pos: {
            x: 1,
            y: 3
          }
        }, {
          name: 'detached_solo',
          pos: {
            x: 0,
            y: 4
          }
        }],
        edges: [{
          src: '~commit',
          dest: 'no_main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~pr',
          dest: 'no_main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: '~sd@241:main',
          dest: 'no_main',
          from: {
            x: 0,
            y: 2
          },
          to: {
            x: 1,
            y: 0
          }
        }, {
          src: 'no_main',
          dest: 'publish',
          from: {
            x: 1,
            y: 0
          },
          to: {
            x: 2,
            y: 0
          }
        }, {
          src: 'wow_new_main',
          dest: 'other_publish',
          from: {
            x: 1,
            y: 1
          },
          to: {
            x: 2,
            y: 1
          }
        }, {
          src: '~commit',
          dest: 'wow_new_main',
          from: {
            x: 0,
            y: 1
          },
          to: {
            x: 1,
            y: 1
          }
        }, {
          src: '~pr',
          dest: 'wow_new_main',
          from: {
            x: 0,
            y: 0
          },
          to: {
            x: 1,
            y: 1
          }
        }, {
          src: '~sd@241:main',
          dest: 'wow_new_main',
          from: {
            x: 0,
            y: 2
          },
          to: {
            x: 1,
            y: 1
          }
        }, {
          src: 'detached_main',
          dest: 'after_detached_main',
          from: {
            x: 0,
            y: 3
          },
          to: {
            x: 1,
            y: 3
          }
        }],
        meta: {
          width: 3,
          height: 5
        }
      };
      const result = (0, _graphTools.decorateGraph)({
        inputGraph: MORE_COMPLEX_GRAPH
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it determines the depth of a graph from various starting points', function (assert) {
      // edges not array
      assert.equal((0, _graphTools.graphDepth)('meow', '~commit'), Number.MAX_VALUE, 'not array'); // simple graph, commit

      assert.equal((0, _graphTools.graphDepth)(SIMPLE_GRAPH.edges, '~commit'), 1, 'simple commit'); // simple graph, pr

      assert.equal((0, _graphTools.graphDepth)(SIMPLE_GRAPH.edges, '~pr'), 1, 'simple pr'); // complex graph, commit

      assert.equal((0, _graphTools.graphDepth)(COMPLEX_GRAPH.edges, '~commit'), 5, 'complex commit'); // more complex graph, commit

      assert.equal((0, _graphTools.graphDepth)(MORE_COMPLEX_GRAPH.edges, '~commit'), 4, 'very complex commit'); // more complex graph, reverse trigger

      assert.equal((0, _graphTools.graphDepth)(MORE_COMPLEX_GRAPH.edges, '~sd@241:main'), 4, 'very complex trigger'); // more complex graph, detached workflow

      assert.equal((0, _graphTools.graphDepth)(MORE_COMPLEX_GRAPH.edges, 'detached_main'), 2, 'very complex detached'); // more complex graph, detached job

      assert.equal((0, _graphTools.graphDepth)(MORE_COMPLEX_GRAPH.edges, 'detached_solo'), 1, 'very complex detached 2'); // more complex graph, partial pipeline

      assert.equal((0, _graphTools.graphDepth)(MORE_COMPLEX_GRAPH.edges, 'publish'), 1, 'very complex partial');
    });
    (0, _qunit.test)('it determines if a job name is a root node', function (assert) {
      assert.ok((0, _graphTools.isRoot)(MORE_COMPLEX_GRAPH.edges, 'detached_main'));
      assert.ok((0, _graphTools.isRoot)(MORE_COMPLEX_GRAPH.edges, '~commit'));
      assert.notOk((0, _graphTools.isRoot)(MORE_COMPLEX_GRAPH.edges, 'no_main'));
    });
    (0, _qunit.test)('it determines if a node name is a trigger node', function (assert) {
      assert.ok((0, _graphTools.isTrigger)('~commit', '~commit'));
      assert.ok((0, _graphTools.isTrigger)('~commit:/^detached_main$/', '~commit:detached_main'));
      assert.ok((0, _graphTools.isTrigger)('~commit:/^detached_main.*$/', '~commit:detached_main1'));
      assert.notOk((0, _graphTools.isTrigger)('~pr:/^detached_main$/', '~commit:detached_main'));
      assert.notOk((0, _graphTools.isTrigger)('~commit:/^detached_main$/', '~commit:detached_main1'));
      assert.notOk((0, _graphTools.isTrigger)('~commit:detached_main', 'no_main'));
    });
    (0, _qunit.test)('it reduce to subgraph given a starting point', function (assert) {
      assert.deepEqual((0, _graphTools.subgraphFilter)(SIMPLE_GRAPH, 'main'), {
        nodes: [{
          name: 'main'
        }],
        edges: []
      });
      assert.deepEqual((0, _graphTools.subgraphFilter)(SIMPLE_GRAPH), SIMPLE_GRAPH);
      assert.deepEqual((0, _graphTools.subgraphFilter)(COMPLEX_GRAPH, 'A'), {
        nodes: [{
          name: 'A',
          id: 2
        }, {
          name: 'C',
          id: 4
        }, {
          name: 'D',
          id: 5
        }],
        edges: [{
          src: 'A',
          dest: 'C'
        }, {
          src: 'C',
          dest: 'D'
        }]
      });
      assert.deepEqual((0, _graphTools.subgraphFilter)(MORE_COMPLEX_GRAPH, 'wow_new_main'), {
        nodes: [{
          name: 'other_publish'
        }, {
          name: 'wow_new_main'
        }],
        edges: [{
          src: 'wow_new_main',
          dest: 'other_publish'
        }]
      });
    });
  });
});
define("screwdriver-ui/tests/unit/utils/template-test", ["screwdriver-ui/utils/template", "qunit"], function (_template, _qunit) {
  "use strict";

  const {
    getFullName,
    getLastUpdatedTime
  } = _template.default;
  (0, _qunit.module)('Unit | Utility | template', function () {
    (0, _qunit.test)('it gets the name as full name when no namespace is passed in', function (assert) {
      const expectedOutput = 'myTemplateName';
      const result = getFullName({
        name: 'myTemplateName',
        namespace: null
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it gets the namespace/name as full name when namespace is passed in', function (assert) {
      const expectedOutput = 'myNamespace/myName';
      const result = getFullName({
        name: 'myName',
        namespace: 'myNamespace'
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it gets the name as full name when namespace is default', function (assert) {
      const expectedOutput = 'myName';
      const result = getFullName({
        name: 'myName',
        namespace: 'default'
      });
      assert.deepEqual(result, expectedOutput);
    });
    (0, _qunit.test)('it gets the last updated time', function (assert) {
      const createTime = '2016-09-23T16:53:00.274Z';
      const timeDiff = Date.now() - new Date(createTime).getTime();
      const expectedOutput = "".concat(humanizeDuration(timeDiff, {
        round: true,
        largest: 1
      }), " ago");
      const result = getLastUpdatedTime({
        createTime
      });
      assert.deepEqual(result, expectedOutput);
    });
  });
});
define("screwdriver-ui/tests/unit/utils/time-range-test", ["screwdriver-ui/utils/time-range", "qunit"], function (_timeRange, _qunit) {
  "use strict";

  (0, _qunit.module)('Unit | Utility | time range', function () {
    (0, _qunit.test)('it returns a range of date times given duration', function (assert) {
      const d = new Date('2019-03-26T21:03:05.183Z');
      let {
        startTime,
        endTime
      } = (0, _timeRange.default)(d, '1hr');
      assert.equal(startTime, '2019-03-26T20:03');
      assert.equal(endTime, '2019-03-26T21:03');
      ({
        startTime,
        endTime
      } = (0, _timeRange.default)(d, '12hr'));
      assert.equal(startTime, '2019-03-26T09:03');
      assert.equal(endTime, '2019-03-26T21:03');
      ({
        startTime,
        endTime
      } = (0, _timeRange.default)(d, '1d'));
      assert.equal(startTime, '2019-03-25T21:03');
      assert.equal(endTime, '2019-03-26T21:03');
      ({
        startTime,
        endTime
      } = (0, _timeRange.default)(d, '1wk'));
      assert.equal(startTime, '2019-03-19T21:03');
      assert.equal(endTime, '2019-03-26T21:03');
      ({
        startTime,
        endTime
      } = (0, _timeRange.default)(d, '1mo'));
      assert.equal(startTime, '2019-02-26T21:03');
      assert.equal(endTime, '2019-03-26T21:03');
    });
    (0, _qunit.test)('it returns a 16-character ISO 8601 up to minute', function (assert) {
      assert.equal((0, _timeRange.iso8601UpToMinute)(new Date('2019-03-26T21:03:05.183Z')), '2019-03-26T21:03');
    });
    (0, _qunit.test)('it returns a locale date time string', function (assert) {
      assert.equal((0, _timeRange.toCustomLocaleString)(new Date('2019-03-26T21:03:05.183Z'), {
        timeZone: 'UTC',
        options: {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      }), '03/26/2019, 9:03 PM');
    });
  });
});
define("screwdriver-ui/tests/unit/validator/controller-test", ["qunit", "ember-qunit", "@ember/test-helpers", "sinon"], function (_qunit, _emberQunit, _testHelpers, _sinon) {
  "use strict";

  const serviceMock = {
    isTemplate: _sinon.default.stub(),
    getValidationResults: _sinon.default.stub()
  };
  const validatorStub = Ember.Service.extend(serviceMock);
  const EXAMPLE_TEMPLATE = "\nname: batman/batmobile\nversion: 2.0.1\ndescription: Big noisy car\nmaintainer: batman@batcave.com\nconfig:\n  image: batman:4\n  steps:\n    - forgreatjustice: ba.sh";
  const EXAMPLE_CONFIG = "\njobs:\n  main:\n    image: batman:4\n    steps:\n      - forgreatjustice: ba.sh\n";
  (0, _qunit.module)('Unit | Controller | validator', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:validator'],

    hooks.beforeEach(function () {
      this.owner.register('service:validator', validatorStub);
      this.validator = this.owner.lookup('service:validator');
      serviceMock.isTemplate.reset();
      serviceMock.getValidationResults.reset();
    });
    (0, _qunit.test)('it handles template yaml', function (assert) {
      const controller = this.owner.lookup('controller:validator');
      const expectedResult = {
        foo: 'bar'
      };
      serviceMock.isTemplate.withArgs(EXAMPLE_TEMPLATE).returns(true);
      serviceMock.getValidationResults.withArgs(EXAMPLE_TEMPLATE).returns(Ember.RSVP.resolve(expectedResult)); // wrap the test in the run loop because we are dealing with async functions

      return Ember.run(() => {
        controller.set('yaml', EXAMPLE_TEMPLATE);
        return (0, _testHelpers.settled)().then(() => {
          assert.equal(controller.get('isTemplate'), true);
          assert.deepEqual(controller.get('results'), expectedResult);
        });
      });
    });
    (0, _qunit.test)('it handles screwdriver yaml', function (assert) {
      const controller = this.owner.lookup('controller:validator');
      const expectedResult = {
        foo: 'bar'
      };
      serviceMock.isTemplate.withArgs(EXAMPLE_CONFIG).returns(false);
      serviceMock.getValidationResults.withArgs(EXAMPLE_CONFIG).returns(Ember.RSVP.resolve(expectedResult)); // wrap the test in the run loop because we are dealing with async functions

      return Ember.run(() => {
        controller.set('yaml', EXAMPLE_CONFIG);
        return (0, _testHelpers.settled)().then(() => {
          assert.equal(controller.get('isTemplate'), false);
          assert.deepEqual(controller.get('results'), expectedResult);
        });
      });
    });
    (0, _qunit.test)('it handles clearing yaml', function (assert) {
      const controller = this.owner.lookup('controller:validator');
      const expectedResult = {
        foo: 'bar'
      };
      serviceMock.isTemplate.withArgs(EXAMPLE_CONFIG).returns(false);
      serviceMock.getValidationResults.withArgs(EXAMPLE_CONFIG).returns(Ember.RSVP.resolve(expectedResult)); // wrap the test in the run loop because we are dealing with async functions

      return Ember.run(() => {
        controller.set('yaml', EXAMPLE_CONFIG);
        return (0, _testHelpers.settled)().then(() => {
          assert.equal(controller.get('isTemplate'), false);
          assert.deepEqual(controller.get('results'), expectedResult);
          controller.set('yaml', '');
          assert.equal(controller.get('results'), '');
        });
      });
    });
  });
});
define("screwdriver-ui/tests/unit/validator/route-test", ["qunit", "ember-qunit"], function (_qunit, _emberQunit) {
  "use strict";

  (0, _qunit.module)('Unit | Route | validator', function (hooks) {
    (0, _emberQunit.setupTest)(hooks);
    (0, _qunit.test)('it exists', function (assert) {
      const route = this.owner.lookup('route:validator');
      assert.ok(route);
    });
  });
});
define("screwdriver-ui/tests/unit/validator/service-test", ["qunit", "ember-qunit", "pretender"], function (_qunit, _emberQunit, _pretender) {
  "use strict";

  const sessionStub = Ember.Service.extend({
    data: {
      authenticated: {
        token: 'faketoken'
      }
    }
  });
  let server;
  const EXAMPLE_CONFIG_PAYLOAD = {
    errors: [],
    jobs: {},
    workflow: ['main']
  };
  const EXAMPLE_TEMPLATE_PAYLOAD = {
    errors: [],
    template: {}
  };
  (0, _qunit.module)('Unit | Service | validator', function (hooks) {
    (0, _emberQunit.setupTest)(hooks); // Specify the other units that are required for this test.
    // needs: ['service:foo']

    hooks.beforeEach(function () {
      this.owner.register('service:session', sessionStub);
      server = new _pretender.default();
      server.post('http://localhost:8080/v4/validator', () => [200, {
        'Content-Type': 'application/json'
      }, JSON.stringify(EXAMPLE_CONFIG_PAYLOAD)]);
      server.post('http://localhost:8080/v4/validator/template', request => {
        if (request.requestBody === '{"yaml":"name: joker"}') {
          return [400, {
            'Content-Type': 'application/json'
          }, JSON.stringify({
            error: 'villains'
          })];
        }

        return [200, {
          'Content-Type': 'application/json'
        }, JSON.stringify(EXAMPLE_TEMPLATE_PAYLOAD)];
      });
    });
    hooks.afterEach(function () {
      server.shutdown();
    });
    (0, _qunit.test)('it determines if something looks like a template', function (assert) {
      const service = this.owner.lookup('service:validator');
      assert.ok(service.isTemplate('name: bananas'));
      assert.notOk(service.isTemplate('workflow: bananas'));
    });
    (0, _qunit.test)('it uploads a template to the validator', function (assert) {
      const service = this.owner.lookup('service:validator');

      server.handledRequest = function (verb, path, request) {
        assert.equal(verb, 'POST');
        assert.equal(request.withCredentials, true);
        assert.ok(request.requestHeaders.Authorization);
      };

      return service.getValidationResults('name: batman').then(response => {
        assert.deepEqual(response, EXAMPLE_TEMPLATE_PAYLOAD);
      });
    });
    (0, _qunit.test)('it uploads a config to the validator', function (assert) {
      const service = this.owner.lookup('service:validator');

      server.handledRequest = function (verb, path, request) {
        assert.equal(verb, 'POST');
        assert.equal(request.withCredentials, true);
        assert.ok(request.requestHeaders.Authorization);
      };

      return service.getValidationResults('workflow: [batman]').then(response => {
        assert.deepEqual(response, EXAMPLE_CONFIG_PAYLOAD);
      });
    });
    (0, _qunit.test)('it handles validator failure', function (assert) {
      const service = this.owner.lookup('service:validator');
      return service.getValidationResults('name: joker').catch(response => {
        assert.equal(response, '400 villains');
      });
    });
  });
});
define('screwdriver-ui/config/environment', [], function() {
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

require('screwdriver-ui/tests/test-helper');
EmberENV.TESTS_FILE_LOADED = true;
//# sourceMappingURL=tests.map
