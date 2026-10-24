'use strict';
const routes = {"21":"day-021/","13":"day-013/","07":"day-007/","7":"day-007/","02":"day-002/","2":"day-002/","03":"day-003/","3":"day-003/","10":"day-010/","18":"day-018/","30":"day-030/"};
const requested = new URLSearchParams(location.search).get('story');
location.replace(Object.hasOwn(routes, requested) ? routes[requested] : '../?volume=2#collection');
