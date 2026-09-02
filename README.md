# Week 1 Assignment: SPL Token and NFT

The assignment uses two source files only:

- `src/spl.ts`: SPL mint, metadata, minting, and transfer.
- `src/nft.ts`: NFT image upload, metadata upload, mint, update, transfer, and
  burn.

## Assignment Requirements

Required:

1. Mint and transfer your own SPL token.
2. Mint an NFT using MPL Core.
3. Update the NFT name and metadata as the update authority.

Optional extension:

4. Transfer the NFT between wallets.
5. Permanently destroy the NFT and reclaim the rent fees.


## Setup

The scripts use Solana devnet and the wallet configured at:

```text
/Users/sidarths/.config/solana/id.json
```


## Required Task 1: SPL Token

### Create the SPL mint

```bash
npm run spl:init
```


The `init()` function:

1. Reads the wallet JSON and creates a signer with
   `createKeyPairSignerFromBytes()`.
2. Creates a new mint signer with `generateKeyPairSigner()`.
3. Gets the mint account size with `getMintSize()`.
4. Gets the rent-exempt balance with
   `rpc.getMinimumBalanceForRentExemption()`.
5. Builds `getCreateAccountInstruction()` with the SPL Token Program as the
   owner of the new account.
6. Builds `getInitializeMintInstruction()` and assigns the wallet as mint
   authority.
7. Gets a recent blockhash, creates a versioned transaction message, signs the
   transaction, and confirms it on devnet.

The mint address and decimals are saved in `artifacts/spl.json`.

### Add SPL metadata

```bash
npm run spl:metadata
```


The `metadata()` function creates a Umi connection and converts the wallet
secret key into a Umi signer with:

- `createUmi()`
- `createSignerFromKeypair()`
- `signerIdentity()`
- `publicKey()`

It then uses `createMetadataAccountV3()` to attach the token name, symbol, and
metadata URI to the SPL mint. The wallet is used as mint authority, payer, and
update authority.

Set a metadata URI before running this step if you have one:

```bash
export SPL_METADATA_URI=https://your-spl-metadata-uri.json
npm run spl:metadata
```

### Mint tokens to your wallet

```bash
npm run spl:mint
```


The `mint()` function:

1. Converts the saved mint to a Kit address with `address()`.
2. Derives the wallet associated token account with
   `findAssociatedTokenPda()`.
3. Creates the ATA with `getCreateAssociatedTokenInstructionAsync()`.
4. Mints tokens with `getMintToCheckedInstruction()`.
5. Builds, signs, sends, and confirms the transaction.

The ATA and mint transaction signature are saved in `artifacts/spl.json`.

### Transfer SPL tokens

```bash
export SPL_RECIPIENT=RECIPIENT_PUBLIC_KEY
npm run spl:transfer
```

`SPL_RECIPIENT` must be a public wallet address. It is not a private key.


The `transfer()` function derives:

- `fromAta`: the current wallet's ATA.
- `toAta`: the recipient wallet's ATA.

It creates the recipient ATA and uses `getTransferCheckedInstruction()` to
transfer the requested amount. The current wallet signs because it owns the
source token account.

## Required Task 2: MPL Core NFT

### Upload the NFT image

```bash
npm run nft:image
```

The `image()` function reads `assets/nft.png` with `readFile()`, converts it to
a Umi file using `createGenericFile()`, and uploads it to the devnet Irys
uploader. The image URI is saved in `artifacts/nft.json`.


### Upload NFT metadata

```bash
npm run nft:metadata
```


The metadata uploaded to Irys has this structure:

```json
{
  "name": "Week 1 Core NFT",
  "symbol": "W1NFT",
  "description": "Week 1 MPL Core NFT",
  "image": "IMAGE_URI_FROM_IRYS"
}
```

The function calls `umi.uploader.uploadJson()` and saves the returned metadata
URI in `artifacts/nft.json`.

### Mint the Core NFT

```bash
npm run nft:mint
```

The `mint()` function:

1. Creates the Umi connection and wallet identity.
2. Enables the MPL Core plugin with `mplCore()`.
3. Creates a new asset signer with `generateSigner()`.
4. Calls MPL Core `create()` with the asset signer, NFT name, and metadata URI.
5. Decodes the transaction signature with `base58.deserialize()`.

The minting wallet becomes the owner and update authority of the NFT. The asset
address and signature are saved in `artifacts/nft.json`.

## Required Task 3: Update the NFT

```bash
npm run nft:update
```

The update branch in `src/nft.ts` performs the following operations:

1. Reads the asset address created by `nft:mint`.
2. Uploads new JSON metadata with an updated name and description.
3. Fetches the current on-chain asset with `fetchAsset()`.
4. Calls MPL Core `update()` with the new name and metadata URI.
5. Signs and confirms the transaction with the minting wallet.

The update succeeds because the minting wallet is the update authority. The new
metadata URI and update signature are saved in `artifacts/nft.json`.

## Optional Task 4: Transfer the NFT

```bash
export NFT_RECIPIENT=RECIPIENT_PUBLIC_KEY
npm run nft:transfer
```

The script fetches the asset with `fetchAsset()` and transfers it with MPL Core
`transfer()`. The current owner must sign the transaction.

## Optional Task 5: Burn the NFT

```bash
npm run nft:burn
```

The script fetches the asset and calls MPL Core `burn()`. This permanently
destroys the NFT account. Its rent becomes reclaimable according to the MPL
Core program rules, so run this only after collecting the transaction evidence
needed for submission.

## Complete Command Order

Run the required tasks in this order:

```bash
npm run spl:init
npm run spl:metadata
npm run spl:mint

export SPL_RECIPIENT=RECIPIENT_PUBLIC_KEY
npm run spl:transfer

npm run nft:image
npm run nft:metadata
npm run nft:mint
npm run nft:update
```

Optional tasks:

```bash
export NFT_RECIPIENT=RECIPIENT_PUBLIC_KEY
npm run nft:transfer
npm run nft:burn
```

## Submission Evidence

The assignment asks for the repository and a screenshot showing successful
execution. Capture the terminal output from the commands above. Each successful
script prints its result and transaction signature, for example:

```text
Mint created: MINT_ADDRESS
Transaction: TRANSACTION_SIGNATURE

Your ATA is: ASSOCIATED_TOKEN_ACCOUNT
Minted amount: 1000000
Transaction: TRANSACTION_SIGNATURE

Signature: TRANSACTION_SIGNATURE
Asset: NFT_ASSET_ADDRESS

Updated NFT: UPDATED_METADATA_URI
```

The screenshot should show the required commands completing without errors and
their transaction signatures. The `artifacts/` files contain the generated
addresses and signatures for reference. Do not include `id.json`, wallet
private keys, or seed phrases in the screenshot or repository.

