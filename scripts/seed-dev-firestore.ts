import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load development environment variables
dotenv.config({ path: '.env.development' });

// Load service account key from file specified by GOOGLE_APPLICATION_CREDENTIALS
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath || !fs.existsSync(credentialsPath)) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS environment variable is not set or the file does not exist.');
  process.exit(1);
}
const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

// Initialize Firebase Admin SDK for DEV
initializeApp({
  credential: cert(serviceAccount),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore();

/**
 * Set up the new Firestore structure for v1.2:
 * - chores: metadata about each chore (template)
 * - choreAssignments: instances of chores assigned to users
 * - users: user accounts
 */
async function setupStructure() {
  // Example: ensure collections exist (Firestore is schemaless, so just seed data)
  // Optionally clear dev collections before seeding
  // await clearCollection('chores');
  // await clearCollection('choreAssignments');
  // await clearCollection('users');
}

// Utility to clear a collection (for dev only)
async function clearCollection(collection: string) {
  const snapshot = await db.collection(collection).get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
}

// Copy users from production to dev
async function copyUsersFromProd() {
  const prodCredentialsPath = process.env.PROD_GOOGLE_APPLICATION_CREDENTIALS;
  if (!prodCredentialsPath || !fs.existsSync(prodCredentialsPath)) {
    console.warn('PROD_GOOGLE_APPLICATION_CREDENTIALS not set or file missing. Skipping user copy from production.');
    return;
  }
  const prodServiceAccount = JSON.parse(fs.readFileSync(prodCredentialsPath, 'utf-8'));
  const prodProjectId = 'klusjes-kampioenen'; // Update if your prod projectId is different
  const prodApp = initializeApp({
    credential: cert(prodServiceAccount),
    projectId: prodProjectId,
  }, 'prod');
  const prodDb = getFirestore(prodApp);

  console.log('Copying users from production to dev...');
  const usersSnap = await prodDb.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    await db.collection('users').doc(userDoc.id).set(userData);
  }
  console.log('Users copied from production to dev!');
}

async function main() {
  await setupStructure();
  await copyUsersFromProd();
  // Optionally seed chores/choreAssignments here
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
