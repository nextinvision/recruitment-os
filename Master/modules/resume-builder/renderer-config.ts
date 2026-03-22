/**
 * Resume Renderer Configuration
 * Based on ATS_SINGLE_COLUMN_EXECUTIVE format
 */

export interface MarginConfig {
    top: number
    bottom: number
    left: number
    right: number
}

export interface TypographyElement {
    font_size: number
    font_weight?: string
    letter_spacing?: number
    alignment?: 'left' | 'center' | 'right' | 'justify'
    uppercase?: boolean
    margin_bottom?: number
    separator?: string
}

export interface RendererConfig {
    meta: {
        version: string
        format_type: string
        page_size: string
    }
    layout: {
        margin: MarginConfig
        columns: number
        section_spacing: number
        company_spacing: number
        role_spacing: number
        bullet_spacing: number
        line_height: number
    }
    typography: {
        font_family: string
        base_font_size: number
        name: TypographyElement
        contact_line: TypographyElement
        section_heading: TypographyElement
        company_name: TypographyElement
        role_title: TypographyElement
        date_range: TypographyElement
        body_text: TypographyElement
        bullet_text: TypographyElement
    }
    design_rules: {
        monochrome: boolean
        no_backgrounds: boolean
        no_borders: boolean
        minimal_whitespace: boolean
        single_column_only: boolean
        ats_optimized: boolean
        bullet_symbol: string
        bullet_indent: number
    }
    structure: {
        order: string[]
        header: {
            layout: string
            elements: Array<{
                type: string
                field?: string
                fields?: string[]
                style: string
            }>
        }
        profile: {
            title: string
            content_type: string
            skills_format: {
                type: string
                separator: string
            }
        }
        experience: {
            title: string
            company_block: {
                layout: string
                left: string[]
                right: string[]
            }
            role_display: string
            responsibilities: {
                list_type: string
            }
        }
        [key: string]: any
    }
}

export const ATS_SINGLE_COLUMN_EXECUTIVE: RendererConfig = {
    meta: {
        version: "1.0",
        format_type: "ATS_SINGLE_COLUMN_EXECUTIVE",
        page_size: "A4"
    },
    layout: {
        margin: { top: 40, bottom: 40, left: 45, right: 45 },
        columns: 1,
        section_spacing: 18,
        company_spacing: 12,
        role_spacing: 6,
        bullet_spacing: 4,
        line_height: 1.25
    },
    typography: {
        font_family: "Calibri, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        base_font_size: 11,
        name: {
            font_size: 20,
            font_weight: "bold",
            letter_spacing: 0.5,
            alignment: "left"
        },
        contact_line: {
            font_size: 10,
            font_weight: "regular",
            alignment: "left",
            separator: " | "
        },
        section_heading: {
            font_size: 12,
            font_weight: "bold",
            uppercase: true,
            letter_spacing: 0.8,
            margin_bottom: 6
        },
        company_name: {
            font_size: 12,
            font_weight: "bold"
        },
        role_title: {
            font_size: 11,
            font_weight: "bold"
        },
        date_range: {
            font_size: 10,
            font_weight: "regular",
            alignment: "right"
        },
        body_text: {
            font_size: 11,
            font_weight: "regular"
        },
        bullet_text: {
            font_size: 11,
            font_weight: "regular"
        }
    },
    design_rules: {
        monochrome: true,
        no_backgrounds: true,
        no_borders: true,
        minimal_whitespace: true,
        single_column_only: true,
        ats_optimized: true,
        bullet_symbol: "●",
        bullet_indent: 14
    },
    structure: {
        order: [
            "header",
            "profile",
            "awards",
            "experience",
            "education",
            "certifications"
        ],
        header: {
            layout: "stacked",
            elements: [
                { type: "text", field: "full_name", style: "name" },
                {
                    type: "inline_row",
                    style: "contact_line",
                    fields: ["location", "phone", "email", "linkedin"]
                }
            ]
        },
        profile: {
            title: "PROFILE",
            content_type: "paragraph",
            skills_format: {
                type: "inline_wrap",
                separator: " | "
            }
        },
        awards: {
            title: "AWARDS & RECOGNITION",
            list_type: "bullet"
        },
        experience: {
            title: "PROFESSIONAL EXPERIENCE",
            company_block: {
                layout: "two_column_header",
                left: ["company", "location"],
                right: ["date_range"]
            },
            role_display: "bold_inline",
            responsibilities: {
                list_type: "bullet"
            }
        },
        education: {
            title: "EDUCATION",
            format: "single_line",
            separator: " - "
        },
        certifications: {
            title: "CERTIFICATIONS",
            format: "single_line",
            separator: " – "
        }
    }
}
