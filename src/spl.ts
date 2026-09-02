import { getCreateAccountInstruction } from "@solana-program/system";
import { getCreateAssociatedTokenInstructionAsync, getInitializeMintInstruction, getMintSize, getMintToCheckedInstruction, getTransferCheckedInstruction, findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";
import { address, appendTransactionMessageInstructions, assertIsTransactionWithBlockhashLifetime, createKeyPairSignerFromBytes, createSolanaRpc, createSolanaRpcSubscriptions, createTransactionMessage, generateKeyPairSigner, getSignatureFromTransaction, sendAndConfirmTransactionFactory, setTransactionMessageFeePayerSigner, setTransactionMessageLifetimeUsingBlockhash, signTransactionMessageWithSigners } from "@solana/kit";
import { createMetadataAccountV3 } from "@metaplex-foundation/mpl-token-metadata";
import { createSignerFromKeypair, publicKey, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { none } from "@metaplex-foundation/umi-options";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

type State = { mint: string; decimals: number; ata?: string };

const command = process.argv[2];
const rpc = createSolanaRpc("https://api.devnet.solana.com");
const rpcSubscriptions = createSolanaRpcSubscriptions("wss://api.devnet.solana.com");
const wallet = JSON.parse(readFileSync("/Users/sidarths/.config/solana/id.json", "utf8")) as number[];
const statePath = resolve(process.cwd(), "artifacts/spl.json");

const readState = () => JSON.parse(readFileSync(statePath, "utf8")) as State;

function saveState(state: State & Record<string, unknown>) {
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

async function init() {
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
  const mint = await generateKeyPairSigner();
  const space = BigInt(getMintSize());
  const rent = await rpc.getMinimumBalanceForRentExemption(space).send();

  const instructions = [
    getCreateAccountInstruction({
      payer: signer,
      newAccount: mint,
      lamports: rent,
      space,
      programAddress: TOKEN_PROGRAM_ADDRESS,
    }),
    getInitializeMintInstruction({
      mint: mint.address,
      mintAuthority: signer.address,
      decimals: Number(6),
    }),
  ];
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = setTransactionMessageLifetimeUsingBlockhash(
    latestBlockhash,
    setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
  );
  const signedTx = await signTransactionMessageWithSigners(
    appendTransactionMessageInstructions(instructions, message),
  );
  assertIsTransactionWithBlockhashLifetime(signedTx);
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  const signature = getSignatureFromTransaction(signedTx);

  saveState({
    mint: mint.address,
    decimals: Number(6),
    signature,
  });
  console.log(`Mint created: ${mint.address}`);
  console.log(`Transaction: ${signature}`);
}

async function metadata(state: State) {
  const u = createUmi("https://api.devnet.solana.com");
  const signer = createSignerFromKeypair(
    u,
    u.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet)),
  );
  u.use(signerIdentity(signer));
  const tx = await createMetadataAccountV3(u, {
    mint: publicKey(state.mint),
    mintAuthority: u.identity,
    payer: u.identity,
    updateAuthority: u.identity,
    data: {
      name: "Week 1 SPL Token",
      symbol: "W1SPL",
      uri: "",
      sellerFeeBasisPoints: 0,
      creators: none(),
      collection: none(),
      uses: none(),
    },
    isMutable: true,
    collectionDetails: none(),
  }).sendAndConfirm(u);

  console.log(`Metadata attached: ${Buffer.from(tx.signature).toString("hex")}`);
}

async function mint(state: State) {
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
  const mint = address(state.mint);
  const [ata] = await findAssociatedTokenPda({
    mint,
    owner: signer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const amount = BigInt("1000000");

  const instructions = [
    await getCreateAssociatedTokenInstructionAsync({
      payer: signer,
      mint,
      owner: signer.address,
    }),
    getMintToCheckedInstruction({
      mint,
      token: ata,
      mintAuthority: signer.address,
      amount,
      decimals: state.decimals,
    }),
  ];
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = setTransactionMessageLifetimeUsingBlockhash(
    latestBlockhash,
    setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
  );
  const signedTx = await signTransactionMessageWithSigners(
    appendTransactionMessageInstructions(instructions, message),
  );
  assertIsTransactionWithBlockhashLifetime(signedTx);
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  const signature = getSignatureFromTransaction(signedTx);

  saveState({ ...state, ata: ata.toString(), mintSignature: signature });
  console.log(`Your ATA is: ${ata}`);
  console.log(`Minted amount: ${amount}`);
  console.log(`Transaction: ${signature}`);
}

async function transfer(state: State) {
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(wallet));
  const mint = address(state.mint);
  const recipient = address(process.env.SPL_RECIPIENT ?? "");
  const amount = BigInt("500000");
  const [fromAta] = await findAssociatedTokenPda({
    mint,
    owner: signer.address,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  const [toAta] = await findAssociatedTokenPda({
    mint,
    owner: recipient,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });

  const instructions = [
    await getCreateAssociatedTokenInstructionAsync({
      payer: signer,
      mint,
      owner: recipient,
    }),
    getTransferCheckedInstruction({
      source: fromAta,
      mint,
      destination: toAta,
      authority: signer.address,
      amount,
      decimals: state.decimals,
    }),
  ];
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = setTransactionMessageLifetimeUsingBlockhash(
    latestBlockhash,
    setTransactionMessageFeePayerSigner(signer, createTransactionMessage({ version: 0 })),
  );
  const signedTx = await signTransactionMessageWithSigners(
    appendTransactionMessageInstructions(instructions, message),
  );
  assertIsTransactionWithBlockhashLifetime(signedTx);
  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  await sendAndConfirm(signedTx, { commitment: "confirmed" });
  const signature = getSignatureFromTransaction(signedTx);

  console.log(`Your from ATA is: ${fromAta}`);
  console.log(`Recipient ATA is: ${toAta}`);
  console.log(`Transferred amount: ${amount}`);
  console.log(`Transaction: ${signature}`);
}

async function main() {
  if (command === "init") {
    await init();
    return;
  }

  const state = readState();
  if (command === "metadata") {
    await metadata(state);
    return;
  }
  if (command === "mint") {
    await mint(state);
    return;
  }
  if (command === "transfer") {
    await transfer(state);
    return;
  }
  throw new Error("Use: npm run spl -- init|metadata|mint|transfer");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
