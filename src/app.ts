import {
  App, VStack, HStack, Text, Button, Spacer, Divider,
  TextField, ScrollView,
  textSetFontSize, textSetFontWeight, textSetColor, textSetString,
  textSetFontFamily,
  buttonSetBordered, buttonSetTextColor,
  widgetAddChild, widgetClearChildren, widgetSetHidden,
  widgetSetBackgroundColor,
  setCornerRadius, setPadding,
  scrollviewSetChild,
  textfieldSetString, textfieldGetString,
} from 'perry/ui';
import { isDarkMode } from 'perry/system';
import { MongoClient } from 'mongodb';

// --- Theme colors (RGBA 0-1) ---
const dark = isDarkMode();

// Background
const bgR = dark ? 0.169 : 1.0;
const bgG = dark ? 0.176 : 0.973;
const bgB = dark ? 0.259 : 0.941;

// Surface
const sfR = dark ? 0.227 : 1.0;
const sfG = dark ? 0.239 : 1.0;
const sfB = dark ? 0.337 : 1.0;

// Text
const txR = dark ? 0.910 : 0.169;
const txG = dark ? 0.914 : 0.176;
const txB = dark ? 0.929 : 0.259;

// Text secondary
const tsR = dark ? 0.553 : 0.420;
const tsG = dark ? 0.600 : 0.443;
const tsB = dark ? 0.682 : 0.580;

// Text muted
const tmR = dark ? 0.420 : 0.553;
const tmG = dark ? 0.443 : 0.600;
const tmB = dark ? 0.580 : 0.682;

// Border
const brR = dark ? 0.290 : 0.910;
const brG = dark ? 0.302 : 0.914;
const brB = dark ? 0.416 : 0.929;

// Mango orange
const moR = 1.0;
const moG = 0.624;
const moB = 0.110;

// Error red
const erR = 0.910;
const erG = 0.341;
const erB = 0.165;

// Success green
const sgR = 0.180;
const sgG = 0.769;
const sgB = 0.714;

// --- In-memory connection storage ---
let connectionNames: string[] = [];
let connectionHosts: string[] = [];
let connectionPorts: string[] = [];
let connectionUris: string[] = [];

// Form inputs
let formName = '';
let formHost = 'localhost';
let formPort = '27017';
let formUri = '';

// Browser inputs
let currentDbName = '';
let currentCollName = '';
let currentFilter = '{}';

// MongoDB client
let mongoClient: any = null;
let currentConnUri = '';

// Track active query context for re-query after edits
let activeDbName = '';
let activeCollName = '';
let lastQueryFilter = '{}';

// Edit state: JSON string of document being edited
let editDocJson = '';

async function connectToMongo(uri: string): Promise<boolean> {
  try {
    mongoClient = await MongoClient.connect(uri);
    currentConnUri = uri;
    return true;
  } catch (e: any) {
    return false;
  }
}

async function queryCollection(dbName: string, collName: string, filter: string): Promise<string> {
  if (!mongoClient) return '{"error":"not connected"}';
  try {
    const db = mongoClient.db(dbName);
    const coll = db.collection(collName);
    const filterStr = filter || '{}';
    const docs = await coll.find(filterStr);
    if (typeof docs === 'string') return docs;
    return JSON.stringify(docs);
  } catch (e: any) {
    return '{"error":"' + (e.message || 'query failed') + '"}';
  }
}

async function updateDocument(dbName: string, collName: string, filter: string, update: string): Promise<number> {
  if (!mongoClient) return 0;
  const db = mongoClient.db(dbName);
  const coll = db.collection(collName);
  const count = await coll.updateOne(filter, update);
  return count;
}

async function deleteDocument(dbName: string, collName: string, filter: string): Promise<number> {
  if (!mongoClient) return 0;
  const db = mongoClient.db(dbName);
  const coll = db.collection(collName);
  const count = await coll.deleteOne(filter);
  return count;
}

// --- Status text ---
const statusText = Text('');
textSetFontSize(statusText, 12);
widgetSetHidden(statusText, 1);

function showStatus(msg: string, isError: boolean): void {
  textSetString(statusText, msg);
  textSetColor(statusText, isError ? erR : sgR, isError ? erG : sgG, isError ? erB : sgB, 1.0);
  widgetSetHidden(statusText, 0);
}

// --- Connection list container ---
const connListContainer = VStack(8, []);

function refreshConnectionList(): void {
  widgetClearChildren(connListContainer);

  if (connectionNames.length === 0) {
    const empty = Text('No saved connections. Add one to get started.');
    textSetFontSize(empty, 14);
    textSetColor(empty, tmR, tmG, tmB, 1.0);
    widgetAddChild(connListContainer, empty);
    return;
  }

  for (let i = 0; i < connectionNames.length; i++) {
    const nameText = Text(connectionNames[i] || 'Untitled');
    textSetFontSize(nameText, 16);
    textSetFontWeight(nameText, 16, 0.5);
    textSetColor(nameText, txR, txG, txB, 1.0);

    const hostPort = `${connectionHosts[i]}:${connectionPorts[i]}`;
    const detailText = Text(hostPort);
    textSetFontSize(detailText, 12);
    textSetColor(detailText, tsR, tsG, tsB, 1.0);

    const connIdx = i;
    const connectBtn = Button('Connect', async () => {
      const uri = connectionUris[connIdx] || `mongodb://${connectionHosts[connIdx]}:${connectionPorts[connIdx]}`;
      showStatus('Connecting...', false);
      const ok = await connectToMongo(uri);
      if (ok) {
        showStatus('Connected!', false);
        textSetString(browserTitle, 'Connected');
        showScreen(1);
      } else {
        showStatus('Connection failed', true);
      }
    });

    const idx = i;
    const deleteBtn = Button('Delete', () => {
      const newNames: string[] = [];
      const newHosts: string[] = [];
      const newPorts: string[] = [];
      const newUris: string[] = [];
      for (let j = 0; j < connectionNames.length; j++) {
        if (j !== idx) {
          newNames.push(connectionNames[j]);
          newHosts.push(connectionHosts[j]);
          newPorts.push(connectionPorts[j]);
          newUris.push(connectionUris[j]);
        }
      }
      connectionNames = newNames;
      connectionHosts = newHosts;
      connectionPorts = newPorts;
      connectionUris = newUris;

      refreshConnectionList();
    });
    buttonSetBordered(deleteBtn, 0);
    buttonSetTextColor(deleteBtn, erR, erG, erB, 1.0);

    const row = HStack(8, [nameText, Spacer(), detailText, deleteBtn, connectBtn]);
    const card = VStack(4, [row]);
    widgetSetBackgroundColor(card, sfR, sfG, sfB, 1.0);
    setCornerRadius(card, 8);
    setPadding(card, 12, 16, 12, 16);

    widgetAddChild(connListContainer, card);
  }
}

// --- Connection form ---
const formContainer = VStack(12, []);
widgetSetHidden(formContainer, 1);

function showConnectionForm(): void {
  widgetClearChildren(formContainer);
  widgetSetHidden(connListContainer, 1);
  widgetSetHidden(formContainer, 0);

  const title = Text('New Connection');
  textSetFontSize(title, 20);
  textSetFontWeight(title, 20, 0.5);
  textSetColor(title, txR, txG, txB, 1.0);

  const nameField = TextField('Connection name', (val: string) => { formName = val; });
  const hostField = TextField('Host (default: localhost)', (val: string) => { formHost = val || 'localhost'; });
  const portField = TextField('Port (default: 27017)', (val: string) => { formPort = val || '27017'; });
  const uriField = TextField('Or paste connection string', (val: string) => { formUri = val; });

  const saveBtn = Button('Save', () => {
    connectionNames.push(formName || 'Untitled');
    connectionHosts.push(formHost);
    connectionPorts.push(formPort);
    connectionUris.push(formUri);


    formName = '';
    formHost = 'localhost';
    formPort = '27017';
    formUri = '';

    widgetSetHidden(formContainer, 1);
    widgetSetHidden(connListContainer, 0);
    refreshConnectionList();
  });

  const cancelBtn = Button('Cancel', () => {
    widgetSetHidden(formContainer, 1);
    widgetSetHidden(connListContainer, 0);
  });
  buttonSetBordered(cancelBtn, 0);

  widgetAddChild(formContainer, title);
  widgetAddChild(formContainer, nameField);
  widgetAddChild(formContainer, hostField);
  widgetAddChild(formContainer, portField);
  widgetAddChild(formContainer, Divider());
  widgetAddChild(formContainer, uriField);
  widgetAddChild(formContainer, HStack(8, [cancelBtn, Spacer(), saveBtn]));
}

// --- Document display area ---
const docsContainer = VStack(4, []);
const docsScroll = ScrollView();
scrollviewSetChild(docsScroll, docsContainer);

const docInfoText = Text('Enter a database and collection name, then click Query.');
textSetFontSize(docInfoText, 14);
textSetColor(docInfoText, tmR, tmG, tmB, 1.0);
widgetAddChild(docsContainer, docInfoText);

// --- Build connection screen ---
refreshConnectionList();

const addBtn = Button('+ New Connection', () => {
  showConnectionForm();
});

const connTitle = Text('Mango');
textSetFontSize(connTitle, 24);
textSetFontWeight(connTitle, 24, 0.7);
textSetColor(connTitle, moR, moG, moB, 1.0);

const connSubtitle = Text('MongoDB GUI');
textSetFontSize(connSubtitle, 12);
textSetColor(connSubtitle, tsR, tsG, tsB, 1.0);

const connectionScreen = VStack(16, [
  HStack(8, [
    VStack(0, [connTitle, connSubtitle]),
    Spacer(),
    addBtn,
  ]),
  statusText,
  Divider(),
  connListContainer,
  formContainer,
  Spacer(),
]);
setPadding(connectionScreen, 24, 32, 24, 32);

// --- Build browser screen ---
const disconnectBtn = Button('Disconnect', async () => {
  if (mongoClient) {
    try { await mongoClient.close(); } catch (e: any) {}
    mongoClient = null;
  }
  showScreen(0);
});
buttonSetBordered(disconnectBtn, 0);
buttonSetTextColor(disconnectBtn, erR, erG, erB, 1.0);

const browserTitle = Text('Connected');
textSetFontSize(browserTitle, 20);
textSetFontWeight(browserTitle, 20, 0.5);
textSetColor(browserTitle, txR, txG, txB, 1.0);

const dbField = TextField('Database name', (val: string) => { currentDbName = val; });
const collField = TextField('Collection name', (val: string) => { currentCollName = val; });
const filterField = TextField('Filter JSON (default: {})', (val: string) => {
  currentFilter = val || '{}';
});

// Extract _id filter string from a JSON document string using string manipulation
// e.g. from '{"_id":{"$oid":"abc123"},"name":"Alice",...}' extracts '{"_id":{"$oid":"abc123"}}'
function extractIdFilter(docJson: string): string {
  // Find the _id value: look for "_id": followed by the value
  const idKey = '"_id":';
  const idStart = docJson.indexOf(idKey);
  if (idStart < 0) return '{}';

  const valueStart = idStart + idKey.length;
  // The _id value could be {"$oid":"..."} or a simple string/number
  if (docJson[valueStart] === '{') {
    // Find matching closing brace
    let depth = 0;
    for (let i = valueStart; i < docJson.length; i++) {
      if (docJson[i] === '{') depth = depth + 1;
      if (docJson[i] === '}') depth = depth - 1;
      if (depth === 0) {
        const idValue = docJson.substring(valueStart, i + 1);
        return '{' + idKey + idValue + '}';
      }
    }
  } else if (docJson[valueStart] === '"') {
    // Simple string _id
    const endQuote = docJson.indexOf('"', valueStart + 1);
    if (endQuote > 0) {
      const idValue = docJson.substring(valueStart, endQuote + 1);
      return '{' + idKey + idValue + '}';
    }
  }
  return '{}';
}

// Remove _id field from JSON string, return the remaining fields as a JSON object string
function removeIdFromJson(docJson: string): string {
  // Parse and rebuild without _id — but since JSON.parse + property access crashes,
  // we do it via string manipulation.
  // Find "_id":{...}, or "_id":"..." and remove it
  const idKey = '"_id":';
  const idStart = docJson.indexOf(idKey);
  if (idStart < 0) return docJson;

  const valueStart = idStart + idKey.length;
  let valueEnd = valueStart;

  if (docJson[valueStart] === '{') {
    let depth = 0;
    for (let i = valueStart; i < docJson.length; i++) {
      if (docJson[i] === '{') depth = depth + 1;
      if (docJson[i] === '}') depth = depth - 1;
      if (depth === 0) { valueEnd = i + 1; break; }
    }
  } else if (docJson[valueStart] === '"') {
    valueEnd = docJson.indexOf('"', valueStart + 1) + 1;
  } else {
    // Number or other — find next comma or closing brace
    for (let i = valueStart; i < docJson.length; i++) {
      if (docJson[i] === ',' || docJson[i] === '}') { valueEnd = i; break; }
    }
  }

  // Remove the _id entry and any trailing/leading comma
  let before = docJson.substring(0, idStart);
  let after = docJson.substring(valueEnd);
  // Clean up commas
  if (after[0] === ',') after = after.substring(1);
  else if (before[before.length - 1] === ',') before = before.substring(0, before.length - 1);

  return before + after;
}

// --- Edit view ---
function showEditView(docJson: string): void {
  widgetClearChildren(docsContainer);

  const idFilter = extractIdFilter(docJson);
  const editableJson = removeIdFromJson(docJson);

  const editTitle = Text('Edit Document');
  textSetFontSize(editTitle, 16);
  textSetFontWeight(editTitle, 16, 0.5);
  textSetColor(editTitle, txR, txG, txB, 1.0);
  widgetAddChild(docsContainer, editTitle);

  const idText = Text('_id: ' + idFilter);
  textSetFontSize(idText, 12);
  textSetColor(idText, tsR, tsG, tsB, 1.0);
  widgetAddChild(docsContainer, idText);

  const editField = TextField('Document JSON (without _id)', (val: string) => {
    editDocJson = val;
  });
  textfieldSetString(editField, editableJson);
  editDocJson = editableJson;
  widgetAddChild(docsContainer, editField);

  const saveBtn = Button('Save', async () => {
    const currentJson = textfieldGetString(editField);
    const updateStr = '{"$set":' + currentJson + '}';
    const modified = await updateDocument(activeDbName, activeCollName, idFilter, updateStr);
    const result = await queryCollection(activeDbName, activeCollName, lastQueryFilter);
    displayDocs(result);
  });

  const deleteBtn = Button('Delete', async () => {
    const deleted = await deleteDocument(activeDbName, activeCollName, idFilter);
    if (deleted > 0) {
      showStatus('Document deleted', false);
    } else {
      showStatus('Delete failed', true);
    }

    const result = await queryCollection(activeDbName, activeCollName, lastQueryFilter);
    displayDocs(result);
  });
  buttonSetBordered(deleteBtn, 0);
  buttonSetTextColor(deleteBtn, erR, erG, erB, 1.0);

  const cancelBtn = Button('Back', async () => {
    const result = await queryCollection(activeDbName, activeCollName, lastQueryFilter);
    displayDocs(result);
  });
  buttonSetBordered(cancelBtn, 0);

  const btnRow = HStack(8, [deleteBtn, Spacer(), cancelBtn, saveBtn]);
  widgetAddChild(docsContainer, btnRow);
}

// --- Document list view ---
function displayDocs(jsonStr: string): void {
  widgetClearChildren(docsContainer);
  let docArray: any[] = [];
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.error) {
      const errText = Text('Error: ' + parsed.error);
      textSetColor(errText, erR, erG, erB, 1.0);
      widgetAddChild(docsContainer, errText);
      return;
    }
    docArray = parsed;
  } catch (e: any) {
    const errText = Text('Parse error');
    textSetColor(errText, erR, erG, erB, 1.0);
    widgetAddChild(docsContainer, errText);
    return;
  }

  const countText = Text(`Found ${docArray.length} document(s)`);
  textSetFontSize(countText, 14);
  textSetFontWeight(countText, 14, 0.5);
  textSetColor(countText, sgR, sgG, sgB, 1.0);
  widgetAddChild(docsContainer, countText);

  for (let i = 0; i < docArray.length; i++) {
    const doc = docArray[i];
    const docStr = JSON.stringify(doc, null, 2);
    const docText = Text(docStr);
    textSetFontSize(docText, 12);
    textSetColor(docText, txR, txG, txB, 1.0);

    // Pass the JSON string (not the object) to the edit view
    const docJsonStr = JSON.stringify(doc);
    const editBtn = Button('Edit', () => {
      showEditView(docJsonStr);
    });
    buttonSetBordered(editBtn, 0);
    buttonSetTextColor(editBtn, moR, moG, moB, 1.0);

    const headerRow = HStack(4, [Spacer(), editBtn]);
    const docCard = VStack(4, [headerRow, docText]);
    widgetSetBackgroundColor(docCard, sfR, sfG, sfB, 1.0);
    setCornerRadius(docCard, 6);
    setPadding(docCard, 8, 12, 8, 12);
    widgetAddChild(docsContainer, docCard);
  }
}

const queryBtn = Button('Query', async () => {
  widgetClearChildren(docsContainer);
  if (!currentDbName || !currentCollName) {
    const errText = Text('Please enter both database and collection names.');
    textSetColor(errText, erR, erG, erB, 1.0);
    widgetAddChild(docsContainer, errText);
    return;
  }
  if (!mongoClient) {
    const errText = Text('Not connected to MongoDB.');
    textSetColor(errText, erR, erG, erB, 1.0);
    widgetAddChild(docsContainer, errText);
    return;
  }

  activeDbName = currentDbName;
  activeCollName = currentCollName;
  lastQueryFilter = currentFilter;

  const loadingText = Text(`Querying ${currentDbName}.${currentCollName}...`);
  textSetFontSize(loadingText, 14);
  textSetColor(loadingText, tsR, tsG, tsB, 1.0);
  widgetAddChild(docsContainer, loadingText);

  const result = await queryCollection(currentDbName, currentCollName, currentFilter);
  displayDocs(result);
});

const dbLabel = Text('Database');
textSetFontSize(dbLabel, 12);
textSetColor(dbLabel, tsR, tsG, tsB, 1.0);

const collLabel = Text('Collection');
textSetFontSize(collLabel, 12);
textSetColor(collLabel, tsR, tsG, tsB, 1.0);

const filterLabel = Text('Filter');
textSetFontSize(filterLabel, 12);
textSetColor(filterLabel, tsR, tsG, tsB, 1.0);

// Quick test button that queries mango_test.users directly
const testBtn = Button('Test: mango_test.users', async () => {
  widgetClearChildren(docsContainer);
  if (!mongoClient) {
    const errText = Text('Not connected. Click Connect first.');
    textSetColor(errText, erR, erG, erB, 1.0);
    widgetAddChild(docsContainer, errText);
    return;
  }

  activeDbName = 'mango_test';
  activeCollName = 'users';
  lastQueryFilter = '{}';

  const loadingText = Text('Querying mango_test.users...');
  textSetFontSize(loadingText, 14);
  textSetColor(loadingText, tsR, tsG, tsB, 1.0);
  widgetAddChild(docsContainer, loadingText);

  const result = await queryCollection('mango_test', 'users', '{}');
  displayDocs(result);
});

const browserScreen = VStack(12, [
  HStack(8, [browserTitle, Spacer(), disconnectBtn]),
  Divider(),
  dbLabel,
  dbField,
  collLabel,
  collField,
  filterLabel,
  HStack(8, [filterField, queryBtn]),
  testBtn,
  Divider(),
  docsScroll,
]);
setPadding(browserScreen, 16, 24, 16, 24);
widgetSetHidden(browserScreen, 1); // Start hidden

// --- Screen switching via visibility ---
function showScreen(idx: number): void {
  if (idx === 0) {
    widgetSetHidden(connectionScreen, 0);
    widgetSetHidden(browserScreen, 1);
  } else {
    widgetSetHidden(connectionScreen, 1);
    widgetSetHidden(browserScreen, 0);
  }
}

// --- Launch app ---
App({
  title: 'Mango',
  width: 900,
  height: 700,
  body: VStack(0, [connectionScreen, browserScreen]),
});
