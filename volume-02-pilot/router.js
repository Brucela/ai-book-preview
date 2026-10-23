'use strict';
const routes = { '21': 'day-021/', '13': 'day-013/', '07': 'day-007/', '7': 'day-007/' };
const requested = new URLSearchParams(location.search).get('story');
location.replace(Object.hasOwn(routes, requested) ? routes[requested] : '../?volume=2#collection');
