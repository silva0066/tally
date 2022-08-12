import { HexString } from "../types"
import { EVMNetwork } from "../networks"
import logger from "./logger"

export type SimpleHashNFTModel = {
  name: string
  description?: string
  token_id: string
  contractAddress: string
  chain: "polygon" | "arbitrum" | "optimism" | "ethereum"
  audio_url: string | null
  image_url: string | null
  video_url: string | null
}

type SimpleHashAPIResponse = {
  nfts: SimpleHashNFTModel[]
}

const CHAIN_ID_TO_NAME = {
  1: "ethereum",
  10: "optimism",
  137: "polygon",
  42161: "arbitrum",
}

/**
 * Get multiple addresses' NFT holdings across collections and networks
 * using the SimpleHash API.
 *
 * Note that pagination isn't supported in this wrapper, so any responses after
 * the first page will be dropped.
 *
 * Learn more at https://simplehash.readme.io/reference/nfts-by-owners
 *
 * @param addresses the addresses whose NFT holdings we want to query
 * @param networks the networks we're querying. Currently supports Ethereum,
 *        Polygon, Arbitrum, & Optimism.
 */
export async function getNFTsByOwners(
  addresses: HexString[],
  networks: EVMNetwork[]
): Promise<SimpleHashNFTModel[]> {
  // TODO err on unsupported networks
  const networkNames = networks
    .map(
      (n) =>
        CHAIN_ID_TO_NAME[Number(n.chainID) as keyof typeof CHAIN_ID_TO_NAME]
    )
    .filter((i) => i)

  const requestURL = new URL("https://api.simplehash.com/api/v0/nfts/owners")
  requestURL.searchParams.set("chains", networkNames.join(","))
  requestURL.searchParams.set("wallet_addresses", addresses.join(","))

  const headers = new Headers()
  headers.set("X-API-KEY", process.env.SIMPLE_HASH_API_KEY ?? "")

  try {
    // TODO validate with AJV
    const result = (await (
      await fetch(requestURL.toString(), {
        headers,
      })
    ).json()) as unknown as SimpleHashAPIResponse
    return result.nfts
  } catch (err) {
    logger.error("Error retrieving NFTs ", err)
  }
  return []
}
