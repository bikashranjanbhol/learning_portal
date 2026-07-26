/**
 * Minimal schema.org types, hand-written rather than pulled from `schema-dts`.
 *
 * schema-dts models the entire vocabulary and its unions produce error messages
 * that are genuinely hard to read when a field is wrong. These cover the eight
 * types this site emits, and they are strict about the fields that matter —
 * which is the point: a typo in a JSON-LD key is invisible until Search Console
 * reports it months later.
 */

export type SchemaContext = { '@context': 'https://schema.org' };

export type ImageObject = {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
};

export type PersonSchema = {
  '@type': 'Person';
  '@id'?: string;
  name: string;
  url?: string;
  sameAs?: string[];
  jobTitle?: string;
  description?: string;
};

export type OrganizationSchema = {
  '@type': 'Organization';
  '@id'?: string;
  name: string;
  url: string;
  logo?: ImageObject | string;
  description?: string;
  sameAs?: string[];
  founder?: PersonSchema | { '@id': string };
};

export type WebPageElementSchema = {
  '@type': 'WebPageElement';
  isAccessibleForFree: boolean;
  cssSelector: string;
};

export type TechArticleSchema = {
  '@type': 'TechArticle';
  '@id'?: string;
  headline: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified: string;
  author: PersonSchema | { '@id': string };
  publisher?: OrganizationSchema | { '@id': string };
  image?: string | ImageObject;
  /**
   * Free chapters emit true; gated ones emit false AND a hasPart WebPageElement
   * naming the gated selector. Blanket-applying false is a CLAUDE.md #7
   * violation and misrepresents free content to Google.
   */
  isAccessibleForFree: boolean;
  hasPart?: WebPageElementSchema;
  proficiencyLevel?: 'Beginner' | 'Intermediate' | 'Expert';
  dependencies?: string;
  articleSection?: string;
  keywords?: string;
  inLanguage?: string;
  mainEntityOfPage?: { '@type': 'WebPage'; '@id': string };
  wordCount?: number;
  timeRequired?: string;
};

export type CourseInstanceSchema = {
  '@type': 'CourseInstance';
  courseMode: 'online';
  courseWorkload?: string;
  instructor?: PersonSchema | { '@id': string };
};

export type OfferSchema = {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  category?: string;
  availability?: 'https://schema.org/InStock';
  url?: string;
};

export type CourseSchema = {
  '@type': 'Course';
  '@id'?: string;
  name: string;
  description: string;
  url: string;
  provider: OrganizationSchema | { '@id': string };
  /** Required by Google's Course rich result since 2024. */
  hasCourseInstance: CourseInstanceSchema[];
  offers?: OfferSchema[];
  educationalLevel?: string;
  inLanguage?: string;
  numberOfCredits?: number;
  teaches?: string[];
  isAccessibleForFree?: boolean;
};

export type QuestionSchema = {
  '@type': 'Question';
  name: string;
  acceptedAnswer: { '@type': 'Answer'; text: string };
};

export type FaqPageSchema = {
  '@type': 'FAQPage';
  '@id'?: string;
  mainEntity: QuestionSchema[];
};

export type BreadcrumbItem = {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
};

export type BreadcrumbListSchema = {
  '@type': 'BreadcrumbList';
  '@id'?: string;
  itemListElement: BreadcrumbItem[];
};

export type SoftwareSourceCodeSchema = {
  '@type': 'SoftwareSourceCode';
  name: string;
  description?: string;
  programmingLanguage: string;
  codeSampleType?: 'full solution' | 'code snippet' | 'template';
  text?: string;
  url?: string;
};

export type WebSiteSchema = {
  '@type': 'WebSite';
  '@id'?: string;
  name: string;
  url: string;
  description?: string;
  publisher?: { '@id': string };
  inLanguage?: string;
};

export type AnySchema =
  | OrganizationSchema
  | PersonSchema
  | TechArticleSchema
  | CourseSchema
  | FaqPageSchema
  | BreadcrumbListSchema
  | SoftwareSourceCodeSchema
  | WebSiteSchema;

/** What actually goes in the <script> tag: one node, or a @graph of them. */
export type SchemaDocument = SchemaContext & (AnySchema | { '@graph': AnySchema[] });
