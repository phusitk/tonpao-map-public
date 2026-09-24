const routes = {
  '/': 's01',
  '/map': 's02',
  '/explore': 's02',
  '/search': 's03',
  '/poi/umbrella-center': 's04',
  '/category/handicraft': 's19',
  '/category/temples-culture': 's20',
  '/category/food-cafe': 's21',
  '/category/community-learning': 's22',
  '/category/accommodation': 's23',
  '/events': 's05',
  '/events/umbrella-festival': 's06',
  '/events/umbrella-festival/parking': 's07',
  '/events/umbrella-festival/schedule': 's08',
  '/plan/templates': 's09',
  '/plan/build': 's10',
  '/plan/result': 's11',
  '/my-itineraries': 's42',
  '/about': 's12',
  '/help': 's13',
  '/privacy': 's14',
  '/terms': 's15',
  '/contributor': 'contributor',
  '/contributor/intro': 'contributor',
  '/contributor/login': 'contributor',
  '/contributor/register': 'contributor',
  '/contributor/verify': 'contributor',
  '/contributor/application-status': 'contributor',
  '/contributor/forgot-password': 'contributor',
  '/contributor/reset-password': 'contributor',
  '/contributor/dashboard': 'contributor',
  '/contributor/pois': 'contributor',
  '/contributor/pois/new': 'contributor',
  '/contributor/pois/edit': 'contributor',
  '/contributor/profile': 'contributor',
  '/contributor/notifications': 'contributor',
  '/offline': 's16',
  '/404': 's17',
  '/500': 's18'
};

const frame = document.querySelector('#prototype');
const status = document.querySelector('#status');
let currentSource = '';
let currentScreen = '';

function currentRoute() {
  const value = location.hash.replace(/^#/, '') || '/';
  return (routes[value] || /^\/poi\/[a-z0-9-]+$/.test(value)) ? value : '/404';
}

function render() {
  const route = currentRoute();
  const screen = routes[route] || (route.startsWith('/poi/') ? 's04' : 's17');
  const poiQuery = route.startsWith('/poi/') ? `?poi=${encodeURIComponent(route.split('/').pop())}` : '';
  // Every viewport now uses the same responsive screen implementation.
  // The former mobile files remain in the repository only as design references.
  const source = screen === 'contributor'
    ? `contributor/index.html?view=${encodeURIComponent(route.split('/').slice(2).join('/') || 'intro')}`
    : `screens/${screen}/desktop.html${poiQuery}`;
  if (source === currentSource) return;
  currentSource = source;
  currentScreen = screen;
  status.hidden = false;
  frame.src = source;
}

frame.addEventListener('load', () => {
  const doc = frame.contentDocument;
  if (doc) {
    doc.body.dataset.screen = currentScreen;

    if (!doc.querySelector('link[data-responsive-shell]')) {
      const stylesheet = doc.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.href = '/responsive-shell.css';
      stylesheet.dataset.responsiveShell = 'true';
      doc.head.appendChild(stylesheet);
    }

    if (!doc.querySelector('script[data-responsive-shell]')) {
      const script = doc.createElement('script');
      script.src = '/responsive-shell.js';
      script.dataset.responsiveShell = 'true';
      doc.body.appendChild(script);
    }

    if (!doc.querySelector('script[data-prototype-actions]')) {
      const script = doc.createElement('script');
      script.src = '/prototype-actions.js';
      script.dataset.prototypeActions = 'true';
      doc.body.appendChild(script);
    }
  }
  status.hidden = true;
});
addEventListener('hashchange', render);
render();
