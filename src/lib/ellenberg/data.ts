/**
 * British Ellenberg indicator values for vascular plants.
 * Source: Hill, M.O., Preston, C.D. & Roy, D.B. (2004). PLANTATT — Attributes of
 * British and Irish Plants. BRC/UKCEH. Licensed under the Open Government Licence v3.0.
 * Attribution: Contains data from PLANTATT © UKCEH/BRC, OGL v3.
 *
 * Values keyed by accepted scientific name (binomial only).
 * L = Light (1=deep shade, 9=full sun)
 * F = Moisture (1=very dry, 9=very wet/aquatic)
 * R = Soil reaction/pH (1=very acid, 9=strongly basic)
 * N = Nitrogen/fertility (1=very infertile, 9=very fertile)
 * S = Salt (0=none, 9=highly saline)
 *
 * NOTE: This is a representative sample of common British natives. The full
 * PLANTATT dataset (~4 000 species) should be imported from the UKCEH EIDC
 * repository (https://doi.org/10.5285/8be765e5-e34c-47df-9ded-c3898b32b2ec).
 */

export interface EllenbergValues {
  L: number
  F: number
  R: number
  N: number
  S: number
}

export const PLANTATT: Record<string, EllenbergValues> = {
  // Trees and large shrubs
  'Quercus robur':          { L: 7, F: 4, R: 5, N: 4, S: 0 },
  'Quercus petraea':        { L: 8, F: 4, R: 3, N: 3, S: 0 },
  'Fagus sylvatica':        { L: 4, F: 4, R: 6, N: 4, S: 0 },
  'Fraxinus excelsior':     { L: 7, F: 5, R: 8, N: 6, S: 0 },
  'Acer pseudoplatanus':    { L: 5, F: 5, R: 7, N: 6, S: 0 },
  'Betula pendula':         { L: 8, F: 3, R: 3, N: 3, S: 0 },
  'Betula pubescens':       { L: 8, F: 6, R: 3, N: 3, S: 0 },
  'Alnus glutinosa':        { L: 7, F: 8, R: 6, N: 7, S: 0 },
  'Tilia cordata':          { L: 5, F: 4, R: 7, N: 5, S: 0 },
  'Ulmus glabra':           { L: 6, F: 5, R: 8, N: 7, S: 0 },
  'Carpinus betulus':       { L: 5, F: 4, R: 6, N: 4, S: 0 },
  'Sorbus aucuparia':       { L: 7, F: 4, R: 3, N: 3, S: 0 },
  'Populus tremula':        { L: 8, F: 5, R: 5, N: 5, S: 0 },

  // Shrubs
  'Corylus avellana':       { L: 6, F: 5, R: 6, N: 5, S: 0 },
  'Crataegus monogyna':     { L: 7, F: 4, R: 6, N: 4, S: 0 },
  'Prunus spinosa':         { L: 7, F: 4, R: 6, N: 5, S: 0 },
  'Salix caprea':           { L: 8, F: 6, R: 5, N: 5, S: 0 },
  'Salix cinerea':          { L: 8, F: 8, R: 5, N: 6, S: 0 },
  'Ilex aquifolium':        { L: 5, F: 5, R: 5, N: 4, S: 0 },
  'Rosa canina':            { L: 8, F: 4, R: 7, N: 5, S: 0 },
  'Sambucus nigra':         { L: 7, F: 5, R: 8, N: 9, S: 0 },

  // Woodland herbs and ground flora
  'Mercurialis perennis':   { L: 4, F: 5, R: 8, N: 6, S: 0 },
  'Oxalis acetosella':      { L: 3, F: 5, R: 4, N: 3, S: 0 },
  'Circaea lutetiana':      { L: 3, F: 5, R: 7, N: 7, S: 0 },
  'Geum urbanum':           { L: 5, F: 5, R: 7, N: 7, S: 0 },
  'Hedera helix':           { L: 3, F: 5, R: 7, N: 5, S: 0 },
  'Hyacinthoides non-scripta': { L: 4, F: 5, R: 5, N: 4, S: 0 },
  'Anemone nemorosa':       { L: 4, F: 5, R: 5, N: 4, S: 0 },
  'Stellaria holostea':     { L: 6, F: 5, R: 6, N: 5, S: 0 },
  'Galium odoratum':        { L: 3, F: 5, R: 7, N: 5, S: 0 },
  'Allium ursinum':         { L: 4, F: 6, R: 8, N: 7, S: 0 },
  'Primula vulgaris':       { L: 6, F: 5, R: 6, N: 5, S: 0 },

  // Weeds and ruderals
  'Urtica dioica':          { L: 6, F: 5, R: 7, N: 8, S: 0 },
  'Galium aparine':         { L: 7, F: 5, R: 7, N: 8, S: 0 },
  'Rubus fruticosus':       { L: 7, F: 5, R: 5, N: 5, S: 0 },
  'Pteridium aquilinum':    { L: 8, F: 4, R: 3, N: 4, S: 0 },
  'Digitalis purpurea':     { L: 8, F: 5, R: 3, N: 4, S: 0 },

  // Ferns
  'Dryopteris filix-mas':   { L: 5, F: 6, R: 5, N: 5, S: 0 },
  'Dryopteris dilatata':    { L: 5, F: 6, R: 4, N: 4, S: 0 },
  'Athyrium filix-femina':  { L: 5, F: 7, R: 4, N: 5, S: 0 },
  'Polypodium vulgare':     { L: 7, F: 3, R: 4, N: 2, S: 0 },
  'Polystichum aculeatum':  { L: 4, F: 5, R: 8, N: 5, S: 0 },

  // Grassland and meadow species
  'Plantago lanceolata':    { L: 8, F: 4, R: 6, N: 4, S: 0 },
  'Plantago major':         { L: 7, F: 5, R: 6, N: 6, S: 0 },
  'Achillea millefolium':   { L: 8, F: 4, R: 5, N: 4, S: 0 },
  'Ranunculus acris':       { L: 8, F: 6, R: 6, N: 6, S: 0 },
  'Trifolium repens':       { L: 8, F: 5, R: 6, N: 5, S: 0 },
  'Lotus corniculatus':     { L: 8, F: 3, R: 6, N: 3, S: 0 },
  'Centaurea nigra':        { L: 8, F: 5, R: 6, N: 4, S: 0 },
  'Leucanthemum vulgare':   { L: 8, F: 4, R: 6, N: 3, S: 0 },
  'Knautia arvensis':       { L: 8, F: 4, R: 8, N: 3, S: 0 },
  'Geranium sylvaticum':    { L: 7, F: 5, R: 7, N: 6, S: 0 },

  // Wetland and waterside
  'Glyceria maxima':        { L: 8, F: 9, R: 7, N: 7, S: 0 },
  'Phragmites australis':   { L: 8, F: 8, R: 7, N: 5, S: 0 },
  'Typha latifolia':        { L: 9, F: 9, R: 7, N: 6, S: 0 },
  'Caltha palustris':       { L: 8, F: 8, R: 6, N: 6, S: 0 },
  'Filipendula ulmaria':    { L: 8, F: 7, R: 6, N: 6, S: 0 },
  'Lythrum salicaria':      { L: 8, F: 7, R: 7, N: 5, S: 0 },

  // Coastal (higher S)
  'Suaeda maritima':        { L: 9, F: 5, R: 9, N: 5, S: 8 },
  'Spartina anglica':       { L: 9, F: 9, R: 9, N: 5, S: 9 },
  'Armeria maritima':       { L: 9, F: 4, R: 7, N: 2, S: 5 },
  'Festuca rubra':          { L: 8, F: 4, R: 6, N: 3, S: 2 },
}
