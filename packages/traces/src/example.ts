import './monkey-patch';

import { doesNotWork } from './sub-example';

try {
    callingExternalFailure();
} catch(e) {
    console.log('Did catch:', e);
}

callingExternalFailure();

function callingExternalFailure() {
    doesNotWork();
}
