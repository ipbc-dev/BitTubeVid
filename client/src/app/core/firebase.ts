import * as firebase from 'firebase/app'
import 'firebase/auth'

const firebaseApp = firebase.initializeApp({
  apiKey: 'AIzaSyAPp8UYTnlz28nfVColD3IXK2olX8Ztbag',
  authDomain: 'bittube-airtime-extension.firebaseapp.com',
  databaseURL: 'https://bittube-airtime-extension.firebaseio.com',
  projectId: 'bittube-airtime-extension',
  storageBucket: 'bittube-airtime-extension.appspot.com',
  messagingSenderId: '632275942486'
})
const firebaseClass = firebase
const firebaseAuth = firebase.auth()

// Listen to authStateChange once once, awaitably.
const authStateChangedOnce = (timeout?: number, needsUser?: boolean) => {
  return new Promise((resolve, reject) => {
    try {
      let timeoutHolder: any

      const unlisten = firebaseAuth.onAuthStateChanged((user) => {
        if (needsUser && user === null) return
        if (timeoutHolder) clearTimeout(timeoutHolder)
        unlisten()
        resolve(user)
      })

      if (timeout) {
        timeoutHolder = setTimeout(() => {
          unlisten()
          reject('Timeout')
        }, timeout)
      }
    } catch (err) {
      reject(err)
    }
  })
}

// Call authStateChangedOnce once in global promise at start, cos its also the firebase ready indicator. I know.
const firebaseReadyPromise = authStateChangedOnce().catch(() => false) // Prevent uncaught in promise errorlogs.

const getFirebaseToken = (forceRefresh = false) =>
  firebaseReadyPromise.then(() => (firebaseAuth.currentUser ? firebaseAuth.currentUser.getIdToken(forceRefresh) : null))

export { firebaseApp, firebaseAuth, firebaseClass, getFirebaseToken }
