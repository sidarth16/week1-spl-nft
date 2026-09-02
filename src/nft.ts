import { burn, create, fetchAsset, mplCore, transfer, update } from "@metaplex-foundation/mpl-core";
import { createGenericFile, createSignerFromKeypair, generateSigner, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";

type State = { imageUri?: string; metadataUri?: string; asset?: string };
const command = process.argv[2];
const rpcUrl = "https://api.devnet.solana.com";
const wallet = JSON.parse(readFileSync("/Users/sidarths/.config/solana/id.json", "utf8")) as number[];
const statePath = resolve(process.cwd(), "artifacts/nft.json");

const readState = () => {
  if (!existsSync(statePath)) return {} as State;
  return JSON.parse(readFileSync(statePath, "utf8")) as State;
};

function saveState(state: State & Record<string, unknown>) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function setupUmi() {
  const u = createUmi(rpcUrl);
  const signer = createSignerFromKeypair(
    u,
    u.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet)),
  );
  u.use(signerIdentity(signer));
  u.use(irysUploader({ address: "https://devnet.irys.xyz/" }));
  u.use(mplCore());
  return u;
}

async function image(state: State) {
  const u = setupUmi();
  const imagePath = resolve(process.cwd(), "assets/nft.png");
  const image = await readFile(imagePath);
  const [imageUri] = await u.uploader.upload([
    createGenericFile(image, "nft.png", { contentType: "image/png" }),
  ]);
  saveState({ ...state, imageUri });
  console.log(`Your image URI: ${imageUri}`);
}

async function metadata(state: State) {
  if (!state.imageUri) throw new Error("Run npm run nft -- image first.");
  const u = setupUmi();
  const metadataUri = await u.uploader.uploadJson({
    name: "Week 1 Core NFT",
    symbol: "W1NFT",
    description: "Week 1 MPL Core NFT",
    image: state.imageUri,
  });
  saveState({ ...state, metadataUri });
  console.log(`Metadata URI: ${metadataUri}`);
}

async function mint(state: State) {
  if (!state.metadataUri) throw new Error("Run npm run nft -- metadata first.");
  const u = setupUmi();
  const asset = generateSigner(u);
  const tx = await create(u, {
    asset,
    uri: state.metadataUri,
    name: "Week 1 Core NFT",
  }).sendAndConfirm(u);
  const signature = base58.deserialize(tx.signature)[0];
  saveState({ ...state, asset: asset.publicKey, mintSignature: signature });
  console.log(`Signature: ${signature}`);
  console.log(`Asset: ${asset.publicKey}`);
}

async function main() {
  const state = readState();
  if (command === "image") {
    await image(state);
    return;
  }
  if (command === "metadata") {
    await metadata(state);
    return;
  }
  if (command === "mint") {
    await mint(state);
    return;
  }
  if (!state.asset) throw new Error("Run npm run nft -- mint first.");
  const u = setupUmi();
  const asset = await fetchAsset(u, publicKey(state.asset));
  if (command === "update") {
    const uri = await u.uploader.uploadJson(
      { 
        name: "Week 1 Core NFT v2",
        symbol: "W1NFT",
        description: "Updated Week 1 metadata",
        image: state.imageUri 
      }
    );
    const tx = await update(u, { asset, name: "Week 1 Core NFT v2", uri }).sendAndConfirm(u);
    saveState({ ...state, updatedMetadataUri: uri, updateSignature: base58.deserialize(tx.signature)[0] });
    console.log(`Updated NFT: ${uri}`);
  } else if (command === "transfer") {
    const tx = await transfer(u, { asset, newOwner: publicKey(process.env.NFT_RECIPIENT ?? "") }).sendAndConfirm(u);
    console.log(`Transferred NFT: ${base58.deserialize(tx.signature)[0]}`);
  } else if (command === "burn") {
    const tx = await burn(u, { asset }).sendAndConfirm(u);
    console.log(`Burned NFT: ${base58.deserialize(tx.signature)[0]}`);
  } else throw new Error("Use: npm run nft -- image|metadata|mint|update|transfer|burn");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
