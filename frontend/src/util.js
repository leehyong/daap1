export function catchEm(promise) {
  return promise.then(data => [null, data])
    .catch(err => [err]);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}