
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.CompanyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  tradeName: 'tradeName',
  cnpj: 'cnpj',
  creci: 'creci',
  phone: 'phone',
  email: 'email',
  website: 'website',
  logoUrl: 'logoUrl',
  address: 'address',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  plan: 'plan',
  settings: 'settings',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  passwordHash: 'passwordHash',
  avatarUrl: 'avatarUrl',
  role: 'role',
  status: 'status',
  creciNumber: 'creciNumber',
  bio: 'bio',
  settings: 'settings',
  emailVerifiedAt: 'emailVerifiedAt',
  lastLoginAt: 'lastLoginAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.RefreshTokenScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  token: 'token',
  family: 'family',
  usedAt: 'usedAt',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.OAuthAccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  provider: 'provider',
  providerUserId: 'providerUserId',
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EmailVerificationScalarFieldEnum = {
  id: 'id',
  email: 'email',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.PasswordResetScalarFieldEnum = {
  id: 'id',
  email: 'email',
  token: 'token',
  expiresAt: 'expiresAt',
  usedAt: 'usedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ContactScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  type: 'type',
  name: 'name',
  email: 'email',
  phone: 'phone',
  mobilePhone: 'mobilePhone',
  cpf: 'cpf',
  cnpj: 'cnpj',
  rg: 'rg',
  birthDate: 'birthDate',
  address: 'address',
  neighborhood: 'neighborhood',
  city: 'city',
  state: 'state',
  zipCode: 'zipCode',
  notes: 'notes',
  tags: 'tags',
  isOwner: 'isOwner',
  isTenant: 'isTenant',
  isGuarantor: 'isGuarantor',
  externalId: 'externalId',
  source: 'source',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  reference: 'reference',
  externalId: 'externalId',
  title: 'title',
  slug: 'slug',
  description: 'description',
  type: 'type',
  purpose: 'purpose',
  category: 'category',
  status: 'status',
  price: 'price',
  priceRent: 'priceRent',
  priceSeason: 'priceSeason',
  priceNegotiable: 'priceNegotiable',
  condoFee: 'condoFee',
  iptu: 'iptu',
  zipCode: 'zipCode',
  street: 'street',
  number: 'number',
  complement: 'complement',
  neighborhood: 'neighborhood',
  city: 'city',
  state: 'state',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  showAddress: 'showAddress',
  condoName: 'condoName',
  totalArea: 'totalArea',
  builtArea: 'builtArea',
  landArea: 'landArea',
  bedrooms: 'bedrooms',
  suites: 'suites',
  bathrooms: 'bathrooms',
  parkingSpaces: 'parkingSpaces',
  floor: 'floor',
  totalFloors: 'totalFloors',
  yearBuilt: 'yearBuilt',
  coverImage: 'coverImage',
  images: 'images',
  videoUrl: 'videoUrl',
  virtualTourUrl: 'virtualTourUrl',
  features: 'features',
  metaTitle: 'metaTitle',
  metaDescription: 'metaDescription',
  metaKeywords: 'metaKeywords',
  portalDescriptions: 'portalDescriptions',
  views: 'views',
  favorites: 'favorites',
  leads: 'leads',
  isFeatured: 'isFeatured',
  isPremium: 'isPremium',
  isHighlighted: 'isHighlighted',
  featuredUntil: 'featuredUntil',
  importSource: 'importSource',
  importedAt: 'importedAt',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyOwnerScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  contactId: 'contactId',
  percentage: 'percentage',
  createdAt: 'createdAt'
};

exports.Prisma.PortalConfigScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  portalId: 'portalId',
  portalName: 'portalName',
  apiKey: 'apiKey',
  apiSecret: 'apiSecret',
  settings: 'settings',
  isActive: 'isActive',
  isPaid: 'isPaid',
  lastSyncAt: 'lastSyncAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PortalPublicationScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  portalId: 'portalId',
  externalId: 'externalId',
  status: 'status',
  publishedAt: 'publishedAt',
  errorMsg: 'errorMsg',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  contactId: 'contactId',
  brokerId: 'brokerId',
  assignedToId: 'assignedToId',
  name: 'name',
  email: 'email',
  phone: 'phone',
  status: 'status',
  source: 'source',
  interest: 'interest',
  budget: 'budget',
  notes: 'notes',
  score: 'score',
  tags: 'tags',
  utmSource: 'utmSource',
  utmMedium: 'utmMedium',
  utmCampaign: 'utmCampaign',
  metadata: 'metadata',
  lastContactAt: 'lastContactAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LeadPropertyScalarFieldEnum = {
  id: 'id',
  leadId: 'leadId',
  propertyId: 'propertyId',
  createdAt: 'createdAt'
};

exports.Prisma.DealScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  leadId: 'leadId',
  brokerId: 'brokerId',
  contactId: 'contactId',
  title: 'title',
  type: 'type',
  status: 'status',
  value: 'value',
  commission: 'commission',
  notes: 'notes',
  closedAt: 'closedAt',
  expectedCloseAt: 'expectedCloseAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DealPropertyScalarFieldEnum = {
  id: 'id',
  dealId: 'dealId',
  propertyId: 'propertyId',
  createdAt: 'createdAt'
};

exports.Prisma.ActivityScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  contactId: 'contactId',
  leadId: 'leadId',
  dealId: 'dealId',
  propertyId: 'propertyId',
  type: 'type',
  title: 'title',
  description: 'description',
  metadata: 'metadata',
  scheduledAt: 'scheduledAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt'
};

exports.Prisma.ApiKeyScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  name: 'name',
  keyHash: 'keyHash',
  prefix: 'prefix',
  scopes: 'scopes',
  lastUsedAt: 'lastUsedAt',
  expiresAt: 'expiresAt',
  isActive: 'isActive',
  createdAt: 'createdAt'
};

exports.Prisma.AuditLogScalarFieldEnum = {
  id: 'id',
  companyId: 'companyId',
  userId: 'userId',
  action: 'action',
  resource: 'resource',
  resourceId: 'resourceId',
  ipAddress: 'ipAddress',
  userAgent: 'userAgent',
  payload: 'payload',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  BROKER: 'BROKER',
  FINANCIAL: 'FINANCIAL',
  CLIENT: 'CLIENT'
};

exports.UserStatus = exports.$Enums.UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  SUSPENDED: 'SUSPENDED'
};

exports.ContactType = exports.$Enums.ContactType = {
  INDIVIDUAL: 'INDIVIDUAL',
  COMPANY: 'COMPANY'
};

exports.PropertyType = exports.$Enums.PropertyType = {
  HOUSE: 'HOUSE',
  APARTMENT: 'APARTMENT',
  LAND: 'LAND',
  FARM: 'FARM',
  RANCH: 'RANCH',
  WAREHOUSE: 'WAREHOUSE',
  OFFICE: 'OFFICE',
  STORE: 'STORE',
  STUDIO: 'STUDIO',
  PENTHOUSE: 'PENTHOUSE',
  CONDO: 'CONDO',
  KITNET: 'KITNET'
};

exports.PropertyPurpose = exports.$Enums.PropertyPurpose = {
  SALE: 'SALE',
  RENT: 'RENT',
  BOTH: 'BOTH',
  SEASON: 'SEASON'
};

exports.PropertyCategory = exports.$Enums.PropertyCategory = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL: 'COMMERCIAL',
  RURAL: 'RURAL',
  INDUSTRIAL: 'INDUSTRIAL'
};

exports.PropertyStatus = exports.$Enums.PropertyStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SOLD: 'SOLD',
  RENTED: 'RENTED',
  PENDING: 'PENDING',
  DRAFT: 'DRAFT'
};

exports.LeadStatus = exports.$Enums.LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  VISITING: 'VISITING',
  PROPOSAL: 'PROPOSAL',
  NEGOTIATING: 'NEGOTIATING',
  WON: 'WON',
  LOST: 'LOST',
  ARCHIVED: 'ARCHIVED'
};

exports.NegotiationType = exports.$Enums.NegotiationType = {
  SALE: 'SALE',
  RENT: 'RENT'
};

exports.DealStatus = exports.$Enums.DealStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  PROPOSAL: 'PROPOSAL',
  CONTRACT: 'CONTRACT',
  CLOSED_WON: 'CLOSED_WON',
  CLOSED_LOST: 'CLOSED_LOST'
};

exports.Prisma.ModelName = {
  Company: 'Company',
  User: 'User',
  Session: 'Session',
  RefreshToken: 'RefreshToken',
  OAuthAccount: 'OAuthAccount',
  EmailVerification: 'EmailVerification',
  PasswordReset: 'PasswordReset',
  Contact: 'Contact',
  Property: 'Property',
  PropertyOwner: 'PropertyOwner',
  PortalConfig: 'PortalConfig',
  PortalPublication: 'PortalPublication',
  Lead: 'Lead',
  LeadProperty: 'LeadProperty',
  Deal: 'Deal',
  DealProperty: 'DealProperty',
  Activity: 'Activity',
  ApiKey: 'ApiKey',
  AuditLog: 'AuditLog'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
