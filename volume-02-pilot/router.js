'use strict';
const routes = {"21":"day-021/","13":"day-013/","07":"day-007/","7":"day-007/","1":"day-001/","01":"day-001/","02":"day-002/","2":"day-002/","3":"day-003/","03":"day-003/","4":"day-004/","04":"day-004/","8":"day-008/","08":"day-008/","9":"day-009/","09":"day-009/","10":"day-010/","12":"day-012/","14":"day-014/","15":"day-015/","16":"day-016/","17":"day-017/","18":"day-018/","20":"day-020/","22":"day-022/","23":"day-023/","24":"day-024/","25":"day-025/","27":"day-027/","28":"day-028/","29":"day-029/","30":"day-030/"};
const requested = new URLSearchParams(location.search).get('story');
location.replace(Object.hasOwn(routes, requested) ? routes[requested] : '../?volume=2#collection');
