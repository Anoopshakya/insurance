export type PageLink = { label: string; href: string };
export type InformationPage = { slug: string; eyebrow: string; title: string; intro: string; sections: { title: string; paragraphs?: string[]; bullets?: string[]; links?: PageLink[] }[]; faqs?: string[][] };
export const informationPages: InformationPage[] = [
  {
    "slug": "become-partner",
    "eyebrow": "Partner with MagikPolicy",
    "title": "Build your insurance business with us",
    "intro": "Understand the registration journey, prepare your information and explore the partner workspace.",
    "sections": [
      {
        "title": "Start with your account",
        "paragraphs": [
          "Create a partner account using the registration page. Keep your contact details accurate so you can receive account and onboarding updates."
        ],
        "links": [
          {
            "label": "Create a partner account",
            "href": "/partner/register?account=1"
          }
        ]
      },
      {
        "title": "Prepare your profile",
        "paragraphs": [
          "The profile process asks for personal, bank and identity information. Upload clear documents only through the secure partner portal."
        ],
        "bullets": [
          "Use your own email address and mobile number.",
          "Keep your identity and bank details consistent.",
          "Review your information before submitting it for approval."
        ]
      },
      {
        "title": "Get familiar with the workspace",
        "paragraphs": [
          "The partner portal brings together leads, customers, policies and earnings. Access and available actions depend on your account status and assigned permissions."
        ],
        "links": [
          {
            "label": "Partner resources",
            "href": "/partner-resources"
          },
          {
            "label": "Training and support",
            "href": "/training-support"
          }
        ]
      }
    ],
    "faqs": [
      [
        "Does registration guarantee approval?",
        "No. Account and profile information must be reviewed before the relevant services are available."
      ],
      [
        "Where can I check earnings?",
        "Sign in to the partner portal and open Earnings. Amounts and payment eligibility depend on the applicable arrangement and policy status."
      ]
    ]
  },
  {
    "slug": "partner-resources",
    "eyebrow": "Partner knowledge centre",
    "title": "Practical resources for your daily work",
    "intro": "A starting point for onboarding, managing enquiries and keeping customer information organised.",
    "sections": [
      {
        "title": "Before you begin",
        "bullets": [
          "Complete the account and profile steps in your partner portal.",
          "Learn how to identify customer requirements without making assumptions.",
          "Keep policy documents and customer information within authorised channels."
        ],
        "links": [
          {
            "label": "Read the onboarding guide",
            "href": "/become-partner"
          }
        ]
      },
      {
        "title": "From enquiry to policy",
        "paragraphs": [
          "Record the customer's stated product needs and follow-up preferences. Explain options using the relevant insurer documents, and confirm details before an application is submitted."
        ],
        "links": [
          {
            "label": "Explore product guides",
            "href": "/products"
          },
          {
            "label": "Open partner portal",
            "href": "/partner/login"
          }
        ]
      },
      {
        "title": "After a policy is issued",
        "bullets": [
          "Check the policy schedule and contact details with the customer.",
          "Help customers locate the insurer's claims information.",
          "Review approaching renewal dates and any changed requirements."
        ],
        "links": [
          {
            "label": "Claims support",
            "href": "/claims"
          },
          {
            "label": "Renewal checklist",
            "href": "/renew"
          }
        ]
      }
    ]
  },
  {
    "slug": "training-support",
    "eyebrow": "Partner development",
    "title": "Learn the process. Get help when you need it.",
    "intro": "Use these learning topics to build confidence with the portal and customer conversations.",
    "sections": [
      {
        "title": "Getting started",
        "bullets": [
          "Account registration and profile submission",
          "Navigating leads, customers and policy records",
          "Understanding account status and permissions"
        ]
      },
      {
        "title": "Product conversations",
        "paragraphs": [
          "Start with a customer's needs, then work through coverage, exclusions, charges and application requirements. Use the insurer's current product documents for specific explanations."
        ],
        "links": [
          {
            "label": "Product overview",
            "href": "/products"
          },
          {
            "label": "Partner FAQs",
            "href": "/partner-faqs"
          }
        ]
      },
      {
        "title": "Request training or portal support",
        "paragraphs": [
          "Contact the support team with the topic you need help with. For a portal problem, include the page name, the action you tried and the error message. Do not include passwords or one-time codes."
        ],
        "links": [
          {
            "label": "Email the support team",
            "href": "mailto:support@magikpolicy.com?subject=Partner%20training%20and%20support"
          },
          {
            "label": "Contact options",
            "href": "/contact"
          }
        ]
      }
    ]
  },
  {
    "slug": "partner-faqs",
    "eyebrow": "Partner help",
    "title": "Answers for your partner journey",
    "intro": "Find the next step for registration, profile completion and everyday portal questions.",
    "sections": [
      {
        "title": "Account and workspace support",
        "paragraphs": [
          "Use the links below for the registration guide and support details. The partner login page also includes password recovery."
        ],
        "links": [
          {
            "label": "Registration guide",
            "href": "/become-partner"
          },
          {
            "label": "Partner sign in",
            "href": "/partner/login"
          },
          {
            "label": "Training and support",
            "href": "/training-support"
          }
        ]
      }
    ],
    "faqs": [
      [
        "How do I register?",
        "Open the partner registration page and create an account. Follow the profile steps shown after sign-in."
      ],
      [
        "Why does my profile need review?",
        "Submitted details and documents are reviewed before the account can use the relevant services. Check your portal for the current status."
      ],
      [
        "What if I forgot my password?",
        "Use Forgot password on the partner login page and follow the instructions sent to your registered email."
      ],
      [
        "Where do I track my leads and policies?",
        "Use the Leads, Customers and Policies sections of your partner workspace."
      ],
      [
        "Are earnings guaranteed?",
        "No. Earnings and payout eligibility depend on the applicable arrangement, issued business and relevant status checks."
      ],
      [
        "How do I report a portal issue?",
        "Contact support with the page name and error details. Never share your password or one-time codes."
      ]
    ]
  },
  {
    "slug": "complaints",
    "eyebrow": "Support and grievance assistance",
    "title": "Help us understand what went wrong",
    "intro": "Choose the right contact for a website issue or a concern about an insurance policy.",
    "sections": [
      {
        "title": "Website or service complaints",
        "paragraphs": [
          "Email our support team with your name, contact details, a description of the issue and any relevant request reference. Keep a copy of your message for follow-up. Share policy documents only when requested through an appropriate channel."
        ],
        "links": [
          {
            "label": "Email your complaint",
            "href": "mailto:support@magikpolicy.com?subject=Service%20complaint"
          }
        ]
      },
      {
        "title": "Policy or claim complaints",
        "paragraphs": [
          "Raise a policy-related grievance with the insurer's grievance redressal officer and retain the acknowledgement. If you are dissatisfied with the insurer's response or do not receive a response, consult the official escalation guidance."
        ],
        "links": [
          {
            "label": "IRDAI grievance guidance",
            "href": "https://irdai.gov.in/grievance-redressal-mechanism1"
          },
          {
            "label": "Bima Bharosa complaint portal",
            "href": "https://bimabharosa.irdai.gov.in/"
          }
        ]
      },
      {
        "title": "Information to keep ready",
        "bullets": [
          "Policy number and insurer name, if relevant",
          "Your earlier complaint reference and correspondence",
          "A clear description of the issue and the outcome you are seeking"
        ],
        "links": [
          {
            "label": "Claim assistance",
            "href": "/claims"
          },
          {
            "label": "Contact us",
            "href": "/contact"
          }
        ]
      }
    ]
  },
  {
    "slug": "faqs",
    "eyebrow": "Insurance questions",
    "title": "A clearer starting point for insurance",
    "intro": "General answers to help you prepare for a conversation. Your policy documents define your actual cover.",
    "sections": [
      {
        "title": "Explore by product",
        "paragraphs": [
          "Each product page includes a comparison checklist and questions to consider. You can request a quotation on our health, car, bike, term life, travel, family and personal accident product pages."
        ],
        "links": [
          {
            "label": "View all products",
            "href": "/products"
          },
          {
            "label": "Choose a product",
            "href": "/products"
          }
        ]
      }
    ],
    "faqs": [
      [
        "What happens after I request a quotation?",
        "Your name, phone number and selected product are recorded for the team to follow up. Submitting a request does not buy a policy."
      ],
      [
        "Can I change the automatically selected product?",
        "Yes. Use the product dropdown in the quotation form before submitting."
      ],
      [
        "What should I compare besides the premium?",
        "Review coverage, exclusions, waiting periods, deductibles, charges and the claims process in the applicable product documents."
      ],
      [
        "Does a quotation guarantee acceptance?",
        "No. The insurer determines eligibility, premium and acceptance based on the completed application and applicable requirements."
      ],
      [
        "How do I get help with a claim?",
        "Use the Claim Assistance page for next steps and contact details. The insurer assesses the claim under the policy terms."
      ],
      [
        "Where can I raise a complaint?",
        "Visit the Complaints page for website support and official policy-related grievance channels."
      ]
    ]
  },
  {
    "slug": "our-mission",
    "eyebrow": "What guides us",
    "title": "Make insurance easier to understand",
    "intro": "Our aim is to help people ask better questions, understand their options and take the next step with confidence.",
    "sections": [
      {
        "title": "Clear information",
        "paragraphs": [
          "We want customers to understand what they are considering: the cover, the conditions and the questions still to ask. Product explanations should help a conversation, while policy documents remain the source for specific benefits and exclusions."
        ]
      },
      {
        "title": "Practical assistance",
        "paragraphs": [
          "From an initial enquiry to a renewal or claim question, we focus on helping people find the relevant information and contact the right team."
        ]
      },
      {
        "title": "Responsible partner growth",
        "paragraphs": [
          "We support partners with an organised workspace and a clear onboarding process. Customer needs, accurate information and careful handling of records are central to that work."
        ],
        "links": [
          {
            "label": "About MagikPolicy",
            "href": "/about"
          },
          {
            "label": "Become a partner",
            "href": "/become-partner"
          }
        ]
      }
    ]
  },
  {
    "slug": "how-it-works",
    "eyebrow": "Your next steps",
    "title": "From a question to an informed choice",
    "intro": "Start with the protection you need. We help organise the next conversation.",
    "sections": [
      {
        "title": "1. Explore your options",
        "paragraphs": [
          "Read the product guides and note the features that matter to you. Think about the people, vehicle, trip or financial goal involved."
        ],
        "links": [
          {
            "label": "Explore products",
            "href": "/products"
          }
        ]
      },
      {
        "title": "2. Request a quotation",
        "paragraphs": [
          "Enter your name and phone number, then select a product. On product pages, the form selects that product for you. You can change it before submitting."
        ],
        "links": [
          {
            "label": "Choose a product",
            "href": "/products"
          }
        ]
      },
      {
        "title": "3. Review the details",
        "paragraphs": [
          "When the team contacts you, explain your needs and ask for the applicable product documents. Review the cover, exclusions, premium and application requirements."
        ]
      },
      {
        "title": "4. Apply and keep your records",
        "paragraphs": [
          "If you decide to proceed, complete the insurer's application accurately. Check any issued policy schedule and keep the policy, payment confirmation and claims contact details together."
        ],
        "links": [
          {
            "label": "Renewal help",
            "href": "/renew"
          },
          {
            "label": "Claim assistance",
            "href": "/claims"
          }
        ]
      }
    ]
  },
  {
    "slug": "careers",
    "eyebrow": "Work with MagikPolicy",
    "title": "Help make insurance easier for people",
    "intro": "Interested in customer support, partner operations or building better digital experiences? Start a conversation with us.",
    "sections": [
      {
        "title": "Tell us about your experience",
        "paragraphs": [
          "Email your CV and a brief introduction explaining the type of work you are interested in. Include your preferred location and how we can contact you."
        ],
        "links": [
          {
            "label": "Send a career enquiry",
            "href": "mailto:support@magikpolicy.com?subject=Career%20enquiry"
          }
        ]
      },
      {
        "title": "What to include",
        "bullets": [
          "Your relevant experience and skills",
          "The role or area of work you would like to explore",
          "A contact email address and phone number"
        ],
        "paragraphs": [
          "Do not include bank details, identity documents or other sensitive records in an initial career enquiry."
        ]
      },
      {
        "title": "Looking for a partner opportunity?",
        "paragraphs": [
          "Partner registration is a separate route from employment. Visit the partner guide if you want to explore building an insurance business."
        ],
        "links": [
          {
            "label": "Become a partner",
            "href": "/become-partner"
          }
        ]
      }
    ]
  },
  {
    "slug": "blog",
    "eyebrow": "MagikPolicy guides",
    "title": "Small reads. Better questions.",
    "intro": "Practical checklists for comparing options, preparing for renewal and keeping policy documents organised.",
    "sections": []
  },
  {
    "slug": "disclaimer",
    "eyebrow": "Website information",
    "title": "Disclaimer",
    "intro": "How to understand the information and quotation requests on this website.",
    "sections": [
      {
        "title": "General information",
        "paragraphs": [
          "Website content is provided to explain products and processes in general terms. It does not replace the applicable insurer's product documents, policy wording or a review of your individual circumstances."
        ]
      },
      {
        "title": "Quotations and coverage",
        "paragraphs": [
          "Submitting a quotation request is an enquiry. It does not create insurance cover, confirm eligibility or guarantee a premium. The insurer's issued policy and schedule determine the cover and its commencement."
        ]
      },
      {
        "title": "Benefits and claims",
        "paragraphs": [
          "Benefits, exclusions, waiting periods, charges and claim outcomes depend on the selected product and its terms. Illustrations and general examples are not a promise of benefits or returns."
        ]
      },
      {
        "title": "External information",
        "paragraphs": [
          "Links to insurer and regulator websites are provided for reference. Those organisations control their content and services. Contact us if you notice information on this website that needs correction."
        ],
        "links": [
          {
            "label": "Contact us",
            "href": "/contact"
          }
        ]
      }
    ]
  },
  {
    "slug": "terms",
    "eyebrow": "Using this website",
    "title": "Terms & Conditions",
    "intro": "The basis on which you can use MagikPolicy's website and submit an enquiry.",
    "sections": [
      {
        "title": "Website use",
        "paragraphs": [
          "Use this website for genuine information requests and authorised account activity. Do not attempt to access another person's account, interfere with the service or submit information you are not entitled to share."
        ]
      },
      {
        "title": "Your enquiry",
        "paragraphs": [
          "Provide accurate contact information when you request a quotation. By submitting the form, you ask the team to contact you about the selected product. A quotation request is not an insurance application or a purchase."
        ]
      },
      {
        "title": "Insurance products",
        "paragraphs": [
          "Eligibility, premiums, benefits and exclusions are determined by the insurer and the relevant product documents. Review the application and policy terms before making a decision or payment."
        ]
      },
      {
        "title": "Accounts and credentials",
        "paragraphs": [
          "Keep your password and verification codes private. Use password recovery if you cannot access your account, and contact support if you believe it has been misused."
        ]
      },
      {
        "title": "Questions and related information",
        "paragraphs": [
          "Contact support if you need clarification about using the website. The pages below explain enquiry data handling, general website information and cancellation enquiries."
        ],
        "links": [
          {
            "label": "Privacy Policy",
            "href": "/privacy-policy"
          },
          {
            "label": "Disclaimer",
            "href": "/disclaimer"
          },
          {
            "label": "Refund and cancellation information",
            "href": "/refund-policy"
          },
          {
            "label": "Contact support",
            "href": "/contact"
          }
        ]
      }
    ]
  },
  {
    "slug": "privacy-policy",
    "eyebrow": "Your information",
    "title": "Privacy Policy",
    "intro": "How information submitted through this website is used to handle your enquiry and account activity.",
    "sections": [
      {
        "title": "Quotation enquiries",
        "paragraphs": [
          "The quotation form collects your name, phone number and chosen product. It also records the page from which you submitted the enquiry so the team can understand your request."
        ]
      },
      {
        "title": "Account and service information",
        "paragraphs": [
          "Registration and service forms may request additional details needed for the relevant process. For example, partner profile completion requests identity and bank information. Provide sensitive documents only through the designated portal steps."
        ]
      },
      {
        "title": "How the information is used",
        "paragraphs": [
          "Information is used to respond to requests, administer accounts and support the relevant service. Authorised team members and service providers may process it for those purposes. If you choose to apply for a policy, the application process may require information to be shared with the insurer."
        ]
      },
      {
        "title": "Session storage and external links",
        "paragraphs": [
          "The website uses browser storage and cookies for account sessions and preferences. Links to third-party services, including WhatsApp and insurers, are governed by their own privacy information."
        ]
      },
      {
        "title": "Questions, corrections and contact preferences",
        "paragraphs": [
          "Contact support to ask about your enquiry information, request a correction or tell us you no longer want follow-up about an enquiry. Include enough context to identify the request, without sending passwords or verification codes."
        ],
        "links": [
          {
            "label": "Contact the support team",
            "href": "mailto:support@magikpolicy.com?subject=Privacy%20enquiry"
          }
        ]
      }
    ]
  },
  {
    "slug": "refund-policy",
    "eyebrow": "Cancellation enquiries",
    "title": "Refund & cancellation information",
    "intro": "Find the relevant terms and contact for a payment, cancellation or refund question.",
    "sections": [
      {
        "title": "Quotation requests",
        "paragraphs": [
          "The shared quotation form collects an enquiry and does not take payment or issue a policy. There is no payment to refund from submitting that form."
        ]
      },
      {
        "title": "Insurance policy cancellations",
        "paragraphs": [
          "Cancellation eligibility, applicable deductions and any refund depend on the insurer, product and policy terms. Consult the policy documents and contact the insurer using its official service channels."
        ]
      },
      {
        "title": "Prepare your request",
        "bullets": [
          "Policy number and insurer name",
          "Payment receipt or transaction reference",
          "Reason for cancellation and relevant correspondence"
        ],
        "paragraphs": [
          "Do not share payment card details, passwords or one-time codes in a support enquiry."
        ]
      },
      {
        "title": "Need assistance?",
        "paragraphs": [
          "Contact us if you need help identifying the relevant policy service channel. We cannot confirm a refund until the responsible provider has assessed the request."
        ],
        "links": [
          {
            "label": "Contact support",
            "href": "/contact"
          },
          {
            "label": "Complaint channels",
            "href": "/complaints"
          }
        ]
      }
    ]
  },
  {
    "slug": "sitemap",
    "eyebrow": "Explore MagikPolicy",
    "title": "Find your way around",
    "intro": "Browse products, support pages and company information from one place.",
    "sections": []
  },
  {
    "slug": "about",
    "eyebrow": "About MagikPolicy",
    "title": "Insurance, made easier to understand",
    "intro": "Explore insurance options, request assistance and connect with the team for your next step.",
    "sections": [
      {
        "title": "A starting point for your insurance needs",
        "paragraphs": [
          "MagikPolicy brings together product information, quotation enquiries and a partner workspace. Our website helps you organise the questions to ask before choosing cover."
        ]
      },
      {
        "title": "Support through the policy journey",
        "paragraphs": [
          "Use the website to explore products and find help with renewal, claims or service questions. The insurer's documents explain the exact terms of a policy."
        ],
        "links": [
          {
            "label": "How it works",
            "href": "/how-it-works"
          },
          {
            "label": "Our mission",
            "href": "/our-mission"
          }
        ]
      },
      {
        "title": "For partners",
        "paragraphs": [
          "Partners can register, complete their profile and use the workspace to organise leads, customers, policies and earnings."
        ],
        "links": [
          {
            "label": "Become a partner",
            "href": "/become-partner"
          },
          {
            "label": "Partner resources",
            "href": "/partner-resources"
          }
        ]
      }
    ]
  },
  {
    "slug": "contact",
    "eyebrow": "Contact us",
    "title": "Let's find the right next step",
    "intro": "Contact the team for insurance enquiries, policy support or help with your partner account.",
    "sections": [
      {
        "title": "Talk to the team",
        "paragraphs": [
          "For an insurance quotation, choose a product from our insurance pages. For other support questions, email us or start a conversation on WhatsApp."
        ],
        "links": [
          {
            "label": "hello@magikpolicy.com",
            "href": "mailto:hello@magikpolicy.com"
          },
          {
            "label": "+91 8920028861",
            "href": "tel:+918920028861"
          },
          {
            "label": "WhatsApp support",
            "href": "https://wa.me/918920028861"
          },
          {
            "label": "Choose a product",
            "href": "/products"
          }
        ]
      },
      {
        "title": "Help us understand your request",
        "bullets": [
          "Tell us whether your question is about a product, existing policy or partner account.",
          "Include an enquiry or policy reference if relevant.",
          "Never send passwords or verification codes."
        ]
      },
      {
        "title": "Find more specific help",
        "links": [
          {
            "label": "Claim assistance",
            "href": "/claims"
          },
          {
            "label": "Policy renewal",
            "href": "/renew"
          },
          {
            "label": "Complaints",
            "href": "/complaints"
          },
          {
            "label": "Partner support",
            "href": "/training-support"
          }
        ]
      }
    ]
  },
  {
    "slug": "resources",
    "eyebrow": "Knowledge centre",
    "title": "Useful guides in one place",
    "intro": "Prepare for your next insurance conversation with practical checklists and answers.",
    "sections": [
      {
        "title": "Choosing cover",
        "paragraphs": [
          "Start with the product you need and review the comparison points on its page. Our FAQs explain how quotation requests work."
        ],
        "links": [
          {
            "label": "Insurance products",
            "href": "/products"
          },
          {
            "label": "Insurance FAQs",
            "href": "/faqs"
          },
          {
            "label": "Read our guides",
            "href": "/blog"
          }
        ]
      },
      {
        "title": "Managing an existing policy",
        "paragraphs": [
          "Keep the policy schedule, payment confirmations and service contact details together. Use the guides below when you need renewal or claims assistance."
        ],
        "links": [
          {
            "label": "Renewal checklist",
            "href": "/renew"
          },
          {
            "label": "Claims support",
            "href": "/claims"
          },
          {
            "label": "Complaint channels",
            "href": "/complaints"
          }
        ]
      },
      {
        "title": "Partner resources",
        "paragraphs": [
          "Find onboarding information, workspace guidance and support for partner enquiries."
        ],
        "links": [
          {
            "label": "Partner knowledge centre",
            "href": "/partner-resources"
          },
          {
            "label": "Training and support",
            "href": "/training-support"
          }
        ]
      }
    ]
  },
  {
    "slug": "renew",
    "eyebrow": "Policy renewal",
    "title": "Prepare for your next policy year",
    "intro": "Review your existing cover and gather the information needed for a renewal conversation.",
    "sections": [
      {
        "title": "Your renewal checklist",
        "bullets": [
          "Check the expiry date and renewal notice.",
          "Review your contact details and the people or property insured.",
          "Note any changes in needs or circumstances.",
          "Compare the renewal terms, premium and any changed conditions."
        ]
      },
      {
        "title": "Keep these details ready",
        "paragraphs": [
          "Have your current policy schedule, insurer name and policy number available. The team may ask for further details when discussing suitable options."
        ]
      },
      {
        "title": "Request a renewal conversation",
        "paragraphs": [
          "Open the relevant insurance product page and use its quotation form. When the team contacts you, tell them you are enquiring about renewal. Coverage dates and renewal conditions are determined by the insurer."
        ],
        "links": [
          {
            "label": "Choose a product",
            "href": "/products"
          },
          {
            "label": "Contact support",
            "href": "/contact"
          }
        ]
      }
    ]
  },
  {
    "slug": "claims",
    "eyebrow": "Claim assistance",
    "title": "Know the next step when you need support",
    "intro": "Keep your policy details ready and contact the insurer through its official claims channel.",
    "sections": [
      {
        "title": "Start with your insurer",
        "paragraphs": [
          "Use the claims contact details in your policy documents. Ask about notification requirements, documents and the process for your specific situation."
        ],
        "bullets": [
          "Keep your policy number and contact details ready.",
          "Record the claim reference and correspondence.",
          "Provide accurate information and the documents requested by the insurer."
        ]
      },
      {
        "title": "Ask us for guidance",
        "paragraphs": [
          "If you need help locating information or understanding the next step, contact our support team. The insurer assesses the claim under the policy terms; assistance does not guarantee acceptance."
        ],
        "links": [
          {
            "label": "Email claims support",
            "href": "mailto:support@magikpolicy.com?subject=Claim%20assistance"
          },
          {
            "label": "WhatsApp support",
            "href": "https://wa.me/918920028861"
          }
        ]
      },
      {
        "title": "If your concern is unresolved",
        "paragraphs": [
          "Use the Complaints page to find the insurer grievance process and official escalation information."
        ],
        "links": [
          {
            "label": "Complaint channels",
            "href": "/complaints"
          }
        ]
      }
    ]
  }
];
export const existingInformationPaths = ["about", "contact", "resources", "renew", "claims"];
export function findInformationPage(slug: string) { return informationPages.find(page => page.slug === slug); }
