# authstore

Store, retrieve and delete MongoDb documents under your lichess username using oauth.

# API

You should use a `POST` request.

## API Url

### Json

`https://authstore.netlify.app/.netlify/functions/netlifyindex`

### Form

`https://authstore.netlify.app/.netlify/functions/netlifyindex?payload=form`

## Request fields

### `LICHESS_TOKEN`

Your lichess access token. No scopes required.

### `COLLECTION`

Collection name. Empty for defult collection. Internally collections will be named {lichess user id}#{collection name} for non empty collection names.

### `DOCUMENT_ID`

MongoDb document id.

### `DOCUMENT`

MongoDb document content.

### `ACTION`

#### `set`

Set a MongoDb document by `DOCUMENT_ID` to `DOCUMENT`.

#### `bulkwrite`

Bulk write documents. `DOCUMENT` should hold in `JSON` format an array of write operations ( see also https://docs.mongodb.com/manual/reference/method/db.collection.bulkWrite/#mongodb-method-db.collection.bulkWrite ).

Example `HTML` simulates this by adding indices 1, 2, 3 to inputted `Document Id` and creating a bulk write array with these the resulting id-s. This action is intended for applications to implement.

`DOCUMENT_ID` is ignored.

#### `get`

Get a MongoDb document by `DOCUMENT_ID`.

`DOCUMENT` is ignored.

#### `delete`

Delete a MongoDb document by `DOCUMENT_ID`.

`DOCUMENT` is ignored.

#### `getall`

Get all MongoDb documents. At most 100 documents will be returned, however you can submit an optional `MAX` parameter to change this.

`DOCUMENT` and `DOCUMENT_ID` are ignored.

#### `countdocs`

Count documents in the collection.

`DOCUMENT` and `DOCUMENT_ID` are ignored.

#### `collsize`

Gets the storage size in bytes of the collection.

`DOCUMENT` and `DOCUMENT_ID` are ignored.

#### `listcollections`

List collections. An array of the internal representation of the collection names will be returned, that is lichess user id, or lichess user id followed by a # and the collection name.

`COLLECTION`, `DOCUMENT` and `DOCUMENT_ID` are ignored.

#### `deletecollection`

Delete collection.

`DOCUMENT` and `DOCUMENT_ID` are ignored.
