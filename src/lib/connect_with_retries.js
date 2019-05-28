//  ===================
//  = Retry Functions =
//  ===================
const pause = (duration) => {
  return new Promise(res => setTimeout(res, duration))
}
const connectWithRetries = async (fn, retries=10, startTimeout=100) => {
  return fn()
    .catch((err) => {
      if (retries > 0) {
        console.log(`Connection failed. retrying in ${startTimeout}ms. (${retries} tries remaining)`)
        return pause(startTimeout).then(() => {
          let nextTimeout = Math.min(10000, Math.floor(startTimeout * 1.5));
          return connectWithRetries(fn, retries - 1, nextTimeout)
        });
      } else {
        return Promise.reject(err)
      }
    });
}

module.exports = connectWithRetries
