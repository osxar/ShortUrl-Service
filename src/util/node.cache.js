import NodeCache from 'node-cache';

// Create a new instance of NodeCache with a TTL of 24 hours
const cache = new NodeCache({ stdTTL: 86400 });

export default cache;