const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

exports.createOrUpdateSyncDoc = (docname, data) => {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
      .documents(docname)
      .fetch()
      .then(doc => {
        updateDoc(twilio, docname, data).then(doc => {
          resolve(doc);
        }).catch((err) => {
          console.log(`error updating ${docname} sync doc`, err);
          reject(err);
        });
      })
      .catch(err => {
        createDoc(twilio, docname, data).then(doc => {
          resolve(doc);
        }).catch((err) => {
          console.log(`error creating ${docname} sync doc`, err);
          reject(err);
        });
      });
  })
}

exports.retrieveSyncMap = (mapName) => {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .syncMaps(mapName).fetch().then(map => {
      resolve(map);
    })
    .catch(err => {
      createMap(twilio, mapName).then((map) => {
        resolve(map);
      }).catch(err => {
        reject(err);
      });
    })
  })
}

exports.createOrUpdateSyncMapItem = (mapSid, mapItemName, data) => {
  return new Promise((resolve, reject) => {
    const tr = twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID);
    tr.syncMaps(mapSid).syncMapItems(mapItemName)
    .fetch()
    .then(mapItem => {
      // update sync Map item
      tr.syncMaps(mapSid)
        .syncMapItems(mapItemName)
        .update({data: data})
        .then((item) => {
          resolve(item);
        })
        .catch(err => {
          reject(err)
        });
    })
    .catch(err => {
      // create sync Map item
      tr.syncMaps(mapSid)
        .syncMapItems
        .create({
          ttl: 3600,
          key: mapItemName,
          data: data
        })
        .then((item) => {
          resolve(item);
        })
        .catch(err => {
          reject(err)
        });
    })
  })
}

function updateDoc(twilio, docname, data) {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .documents(docname)
    .update({data: data})
    .then(document => {
      resolve(document);
    }).catch(err => {
      reject(err);
    })
  })
}

function createDoc(twilio, docname, data) {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .documents
    .create({data: data, ttl: 3600, uniqueName: docname})
    .then(document => {
      resolve(document);
    }).catch(err => {
      reject(err);
    })
  })
}

function createMap(twilio, mapName) {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .syncMaps.create({ uniqueName: mapName })
    .then(map => {
      resolve(map);
    })
    .catch(err => {
      reject(err);
    })
  });
}