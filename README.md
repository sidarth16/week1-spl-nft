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

export SPL_RECIPIENT=<RECIPIENT_PUBLIC_KEY>
npm run spl:transfer

npm run nft:image
npm run nft:metadata
npm run nft:mint
npm run nft:update
```

Optional tasks:

```bash
export NFT_RECIPIENT=<RECIPIENT_PUBLIC_KEY>
npm run nft:transfer
npm run nft:burn
```


## Recorded Execution Output

The following is the execution trace recorded in [`outputs`](outputs) while
running the scripts on Solana devnet:

1. Mint and transfer your own SPL token.

```text

sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run spl:init

> week1-spl-nft@1.0.0 spl:init
> npx ts-node src/spl.ts init

Mint created: GvWRYF1BtYMCdJwcQShwm9UTEAimTe59TCesuem8yQEa
Transaction: dMhdBYNHuSutChUpxPaABtUPJ4JnXLA4dfyCY1QWqq3u1aFxdyL2yDfhLCewgmN12LyEAJWoxesptabMd3UJmFJ

sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run spl:metadata

> week1-spl-nft@1.0.0 spl:metadata
> npx ts-node src/spl.ts metadata

Metadata attached: 4d482fb8be31f7757cc8f024f81551372064107f8c869872c38cdb06c4d082852322c5129268cffca873bd5e0d675b250a92318753e213f40178419091cf6509

sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run spl:mint

> week1-spl-nft@1.0.0 spl:mint
> npx ts-node src/spl.ts mint

Your ATA is: C1EKneExWrgDDrGFoEuRWwa8ZjC2uYURP4PAdLi8d6qJ
Minted amount: 1000000
Transaction: 2k1TD9jfn8CkK36J8WfTSHMSmNZi49Bqqtdefc4gSpdbeqF8ciHxQCGC8kieBChoPZotCQQeP8WGx8bz4VzYwvh6

sidarths@Sidarths-MacBook-Pro week1-spl-nft % export SPL_RECIPIENT=8MGGrmWLYRdHSm4CnP2tVnhEo4gUmJbZFnqcnn2LXp2J
sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run spl:transfer

> week1-spl-nft@1.0.0 spl:transfer
> npx ts-node src/spl.ts transfer

Your from ATA is: C1EKneExWrgDDrGFoEuRWwa8ZjC2uYURP4PAdLi8d6qJ
Recipient ATA is: 727aNxA3KFbgCDvoMshWaD4EtnJnMgwE77sj5ZjAcnyK
Transferred amount: 500000
Transaction: 3hPfrKteLB33VCb1a8doYLudmz8aobYGoYktGmYyix61SjtKRz5WTvnchFViCPXq9AWdZz88j7cocrbXya7jMER4
```

2. Mint an NFT using MPL Core.

```text
sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run nft:image

> week1-spl-nft@1.0.0 nft:image
> npx ts-node src/nft.ts image

Your image URI: https://gateway.irys.xyz/FSXzXdUMbqXsmkaivhb4W2Nnn8AkSK64pVmWAggjiQPL

sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run nft:metadata

> week1-spl-nft@1.0.0 nft:metadata
> npx ts-node src/nft.ts metadata

Metadata URI: https://gateway.irys.xyz/GyFiXE5MPYom22Jdbsr54c4bk8YvzNpiB3Sicm8TVsH4

sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run nft:mint

> week1-spl-nft@1.0.0 nft:mint
> npx ts-node src/nft.ts mint

Signature: 2ZaRbUBcosNJMqWoV2An1HAd9h6rdR3eLKuTKowNuy45imVcfQDkDafXunR9NhXh3acJUfKPauTqiTZHqtNVdxmF
Asset: ARaxFaGerUYExdpQCNhASYVq4hHq4Am14Xaba5NpG9eW
```

3. Update the NFT's name and metadata as the update authority
```text
sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run nft:update

> week1-spl-nft@1.0.0 nft:update
> npx ts-node src/nft.ts update

Updated NFT: https://gateway.irys.xyz/91DHBT3Q2ATECLaAWNpJPRZ3aF1uJFeDz4C9AJHVasx2

sidarths@Sidarths-MacBook-Pro week1-spl-nft % export NFT_RECIPIENT=8MGGrmWLYRdHSm4CnP2tVnhEo4gUmJbZFnqcnn2LXp2J
sidarths@Sidarths-MacBook-Pro week1-spl-nft % npm run nft:transfer

> week1-spl-nft@1.0.0 nft:transfer
> npx ts-node src/nft.ts transfer

Transferred NFT: 3vPYfLH5msC7okzDjw3sasygeSwEdMxi3ZZQZWjm4CjgcJT9ZjwRaArZLGuW9cc2y6rbEWdYmVCmehtJStWrkycF
```

## Devnet Transaction Links

The following links open the recorded transactions in Solana Explorer on
devnet:

| Task | Transaction |
| --- | --- |
| SPL mint creation | [View transaction](https://explorer.solana.com/tx/dMhdBYNHuSutChUpxPaABtUPJ4JnXLA4dfyCY1QWqq3u1aFxdyL2yDfhLCewgmN12LyEAJWoxesptabMd3UJmFJ?cluster=devnet) |
| SPL metadata | [View transaction](https://explorer.solana.com/tx/2YcmLWTbB4Rs3UKoH5GTGSNnRqz2HfPV6CXp9yDjTogW8ug8HjsuEnJ9WmCF8voY4pZfETYxVwZBL4sg58s4N6g8?cluster=devnet) |
| SPL token mint | [View transaction](https://explorer.solana.com/tx/2k1TD9jfn8CkK36J8WfTSHMSmNZi49Bqqtdefc4gSpdbeqF8ciHxQCGC8kieBChoPZotCQQeP8WGx8bz4VzYwvh6?cluster=devnet) |
| SPL token transfer | [View transaction](https://explorer.solana.com/tx/3hPfrKteLB33VCb1a8doYLudmz8aobYGoYktGmYyix61SjtKRz5WTvnchFViCPXq9AWdZz88j7cocrbXya7jMER4?cluster=devnet) |
| MPL Core NFT mint | [View transaction](https://explorer.solana.com/tx/2ZaRbUBcosNJMqWoV2An1HAd9h6rdR3eLKuTKowNuy45imVcfQDkDafXunR9NhXh3acJUfKPauTqiTZHqtNVdxmF?cluster=devnet) |
| NFT metadata update | [View transaction](https://explorer.solana.com/tx/3ycmR5uufrjsJdoP23Rd7dsjFhHQWiwGDw8dHhvkXqK4WoNpb8abJJq2b36TrQwYks1Uqo2xL6DGxbnQkMJ8J6va?cluster=devnet) |
| Optional NFT transfer | [View transaction](https://explorer.solana.com/tx/3vPYfLH5msC7okzDjw3sasygeSwEdMxi3ZZQZWjm4CjgcJT9ZjwRaArZLGuW9cc2y6rbEWdYmVCmehtJStWrkycF?cluster=devnet) |
