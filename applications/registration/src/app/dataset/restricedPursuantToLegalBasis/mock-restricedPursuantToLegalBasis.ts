import { RestricedPursuantToLegalBasis} from './restricedPursuantToLegalBasis'

export const DISTRIBUTIONS: RestricedPursuantToLegalBasis[] = [
    {id: "dist1", format:["application/json"], description: {"nb":"Plain data"}, accessURL: ["http://access1"], downloadURL: ["http://download1"], license: "http://license1" },
    {id: "dist2", format:["zip"], description: {"nb":"Compressed data"}, accessURL: ["http://access2"], downloadURL: ["http://download2"], license: "http://license2" },
];
