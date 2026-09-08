export type WebsiteProduct = { type: string; slug: string; aliases: string[]; icon: string; name: string; copy: string; overview: string; checks: string[]; prepare: string[]; faq: string[][] };

export const products: WebsiteProduct[] = [
  {
    "type": "health",
    "slug": "health-insurance",
    "aliases": [
      "health"
    ],
    "icon": "?",
    "name": "Health Insurance",
    "copy": "Explore health cover for hospital expenses and understand the details before you choose.",
    "overview": "A health insurance plan can help you manage eligible medical expenses. Compare the cover, your share of costs and the hospitals available under each plan.",
    "checks": [
      "Sum insured and individual or family cover",
      "Waiting periods and pre-existing condition terms",
      "Room limits, co-payments and deductibles",
      "Network hospitals and cashless claim process"
    ],
    "prepare": [
      "Age and city of each person to be insured",
      "Existing cover and renewal date, if any",
      "Your preferred sum insured"
    ],
    "faq": [
      [
        "Is every treatment covered?",
        "Coverage depends on the policy wording, exclusions and waiting periods. Ask for the policy details before applying."
      ],
      [
        "Can I request cover for my family?",
        "Yes. Choose Family Insurance in the quotation form to discuss options for multiple family members."
      ]
    ]
  },
  {
    "type": "car",
    "slug": "car-insurance",
    "aliases": [
      "car"
    ],
    "icon": "?",
    "name": "Car Insurance",
    "copy": "Compare car insurance options around your vehicle, its use and your coverage needs.",
    "overview": "Car insurance options differ in the protection they offer. Review third-party liability, own-damage protection and any add-ons separately so you understand what you are choosing.",
    "checks": [
      "Type of cover and insured declared value",
      "Deductibles and claim conditions",
      "Add-ons and their exclusions",
      "Garage network and repair process"
    ],
    "prepare": [
      "Vehicle registration and model details",
      "Previous policy and renewal date",
      "Previous claims and current no-claim bonus details"
    ],
    "faq": [
      [
        "Are add-ons included automatically?",
        "No. Check which add-ons appear in the quotation and policy schedule, and what additional premium and conditions apply."
      ],
      [
        "Can I compare a renewal quotation?",
        "Yes. Share your current policy details with the team when they contact you."
      ]
    ]
  },
  {
    "type": "bike",
    "slug": "bike-insurance",
    "aliases": [
      "bike"
    ],
    "icon": "?",
    "name": "Bike Insurance",
    "copy": "Find out what to compare when choosing insurance for your two-wheeler.",
    "overview": "Review insurance options for your bike or scooter based on its age, model and use. Check the cover period and what happens if you need to make a claim.",
    "checks": [
      "Third-party and own-damage coverage",
      "Vehicle value and deductibles",
      "Optional benefits and exclusions",
      "Policy dates and claims procedure"
    ],
    "prepare": [
      "Registration number, make and model",
      "Current policy details",
      "Previous claim history"
    ],
    "faq": [
      [
        "Can I enquire for a scooter?",
        "Yes. This quotation request covers both bikes and scooters."
      ],
      [
        "Does a quotation start my coverage?",
        "No. Coverage begins only as stated in a policy issued by the insurer."
      ]
    ]
  },
  {
    "type": "term",
    "slug": "term-life-insurance",
    "aliases": [
      "term",
      "term-insurance"
    ],
    "icon": "?",
    "name": "Term Life Insurance",
    "copy": "Explore life protection with your dependants, responsibilities and chosen cover period in mind.",
    "overview": "Term insurance is designed around life protection for a specified period. Compare the sum assured, policy term, premium payment options and eligibility requirements.",
    "checks": [
      "Sum assured and policy term",
      "Premium payment period and frequency",
      "Exclusions and disclosure requirements",
      "Optional riders and benefit conditions"
    ],
    "prepare": [
      "Age, occupation and income information",
      "Dependants and financial responsibilities",
      "Existing life insurance cover"
    ],
    "faq": [
      [
        "How much cover should I request?",
        "Consider the needs of your dependants, existing cover and financial commitments. The team can help you compare the available options."
      ],
      [
        "Are medical details needed?",
        "The insurer may request health information or medical tests. Provide accurate information throughout the application."
      ]
    ]
  },
  {
    "type": "travel",
    "slug": "travel-insurance",
    "aliases": [
      "travel"
    ],
    "icon": "?",
    "name": "Travel Insurance",
    "copy": "Explore protection for your trip, from medical emergencies to specified travel disruptions.",
    "overview": "Travel policies vary by destination, duration and traveller profile. Review the situations covered and the assistance available before you leave.",
    "checks": [
      "Geographical area and travel dates",
      "Emergency medical limits and exclusions",
      "Cancellation, delay and baggage conditions",
      "Adventure activity and pre-existing condition terms"
    ],
    "prepare": [
      "Destination and dates of travel",
      "Age of each traveller",
      "Purpose of travel and planned activities"
    ],
    "faq": [
      [
        "Does one plan cover every destination?",
        "No. Confirm that every destination on your itinerary is covered by the selected policy."
      ],
      [
        "Can I enquire for more than one traveller?",
        "Yes. Share the number and ages of travellers when the team follows up."
      ]
    ]
  },
  {
    "type": "family",
    "slug": "family-insurance",
    "aliases": [
      "family"
    ],
    "icon": "?",
    "name": "Family Insurance",
    "copy": "Explore family health insurance with the needs of every member in mind.",
    "overview": "Family health cover may use a shared sum insured or individual limits, depending on the plan. Compare these options against the ages and needs of the people you want to insure.",
    "checks": [
      "Members eligible under the plan",
      "Shared versus individual cover limits",
      "Waiting periods and medical disclosures",
      "Co-payments, network hospitals and renewal terms"
    ],
    "prepare": [
      "Relationship and age of each family member",
      "Existing family health policies",
      "Preferred cover amount and city"
    ],
    "faq": [
      [
        "Is family insurance the same as life insurance?",
        "On this page, Family Insurance refers to family health cover. For life protection, explore Term Life Insurance or Life Insurance."
      ],
      [
        "Can parents be included?",
        "Eligibility and available options depend on the insurer and product. Include their ages when discussing your request."
      ]
    ]
  },
  {
    "type": "personal-accident",
    "slug": "personal-accident-insurance",
    "aliases": [
      "personal-accident"
    ],
    "icon": "?",
    "name": "Personal Accident Insurance",
    "copy": "Understand cover for specified accidental injuries and their financial impact.",
    "overview": "Personal accident policies may provide benefits for accidental death or disability, subject to the policy terms. Compare the events covered and the way benefits are calculated.",
    "checks": [
      "Accidental death and disability benefits",
      "Benefit limits and exclusions",
      "Occupation and activity restrictions",
      "Required claim documents"
    ],
    "prepare": [
      "Age and occupation",
      "Nature of work and activities",
      "Existing accident cover"
    ],
    "faq": [
      [
        "Does it replace health insurance?",
        "The products serve different needs. Compare the specified accident benefits with the medical expense coverage in your health policy."
      ],
      [
        "Is every injury covered?",
        "No. The policy defines the covered events, exclusions and evidence required for a claim."
      ]
    ]
  },
  {
    "type": "motor",
    "slug": "motor-insurance",
    "aliases": [
      "motor"
    ],
    "icon": "?",
    "name": "Motor Insurance",
    "copy": "Explore vehicle cover and choose the insurance category that fits your car or two-wheeler.",
    "overview": "Start with the type of vehicle you want to insure. Our dedicated car and bike pages explain the information to prepare and the features to compare.",
    "checks": [
      "Vehicle type and use",
      "Cover type and policy period",
      "Vehicle value and deductibles",
      "Claims service and optional add-ons"
    ],
    "prepare": [
      "Vehicle registration details",
      "Current policy, if available",
      "Details of previous claims"
    ],
    "faq": [
      [
        "Which product should I select?",
        "Choose Car Insurance for a car or Bike Insurance for a two-wheeler. Use Motor Insurance if you need help identifying the category."
      ],
      [
        "Can I request renewal assistance?",
        "Yes. Visit the Policy Renew page for the renewal checklist."
      ]
    ]
  },
  {
    "type": "life",
    "slug": "life-insurance",
    "aliases": [
      "life"
    ],
    "icon": "?",
    "name": "Life Insurance",
    "copy": "Understand life insurance benefits, commitments and options before choosing a plan.",
    "overview": "Life insurance products can have different protection and savings features. Review the benefit illustration and policy terms to understand the commitments and benefits of a particular product.",
    "checks": [
      "Protection benefit and policy duration",
      "Premium commitment and payment frequency",
      "Guaranteed and non-guaranteed benefits",
      "Exit, surrender and exclusion terms"
    ],
    "prepare": [
      "Age and financial responsibilities",
      "Existing life insurance policies",
      "Your protection needs and payment preferences"
    ],
    "faq": [
      [
        "Are all benefits guaranteed?",
        "No. Review the product documents and benefit illustration to distinguish guaranteed benefits from other illustrations."
      ],
      [
        "How does term cover differ?",
        "Term products primarily focus on life protection. Compare the specific features of each product before choosing."
      ]
    ]
  },
  {
    "type": "investment",
    "slug": "investment-plans",
    "aliases": [
      "investment"
    ],
    "icon": "?",
    "name": "Investment Plans",
    "copy": "Discuss your goals and understand product risks, costs and commitments.",
    "overview": "Start with your goal, time horizon and need for access to your money. Review the product documents and understand the risks before making a commitment.",
    "checks": [
      "Goal, time horizon and liquidity needs",
      "Charges and premium commitments",
      "Market-linked versus guaranteed benefits",
      "Exit conditions and product risks"
    ],
    "prepare": [
      "Your savings goal and target timeframe",
      "Expected contribution amount",
      "Existing commitments and risk preferences"
    ],
    "faq": [
      [
        "Are returns guaranteed?",
        "Only benefits expressly described as guaranteed in the product documents should be treated as guaranteed. Illustrations are not promises."
      ],
      [
        "Does submitting this form invest my money?",
        "No. It only requests a conversation about available options."
      ]
    ]
  }
];

export function findProduct(slug: string) { return products.find(product => product.slug === slug || product.aliases.includes(slug)); }
export function productForPath(pathname: string) { const match = pathname.match(/^\/products\/([^/]+)\/?$/); return match ? findProduct(match[1]) : undefined; }
