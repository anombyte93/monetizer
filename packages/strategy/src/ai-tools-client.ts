/**
 * AI Tools Client
 *
 * Unified client for integrating with external AI content generation services.
 * All tools are automatically available when API keys are configured.
 *
 * Supported Services:
 * - AdCreative.ai - Ad creative generation
 * - Copy.ai - Marketing copy workflows
 * - Runway ML - Gen-4 video generation
 * - Synthesia - AI avatar videos
 * - HeyGen - AI spokesperson videos
 * - DALL-E 3 - Image generation (via OpenAI)
 */

import FormData from 'form-data';

// ============================================================================
// Types
// ============================================================================

export interface AIToolsConfig {
  // Image generation
  openaiApiKey?: string;           // DALL-E 3
  adcreativeApiKey?: string;       // AdCreative.ai
  adcreativeApiSecret?: string;    // AdCreative.ai secret
  adcreativeBearerToken?: string;  // AdCreative.ai bearer

  // Copy generation
  copyaiApiKey?: string;           // Copy.ai Workflows

  // Video generation
  runwayApiKey?: string;           // Runway ML
  synthesiaApiKey?: string;        // Synthesia
  heygenApiKey?: string;           // HeyGen
}

export interface GeneratedImage {
  url: string;
  provider: 'dalle' | 'adcreative' | 'midjourney';
  prompt?: string;
  metadata: Record<string, unknown>;
  cost: number;
}

export interface GeneratedCopy {
  text: string;
  provider: 'copyai' | 'jasper' | 'anthropic';
  type: 'headline' | 'body' | 'cta' | 'email' | 'social';
  metadata: Record<string, unknown>;
  cost: number;
}

export interface GeneratedVideo {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  url?: string;
  provider: 'runway' | 'synthesia' | 'heygen';
  duration?: number;
  metadata: Record<string, unknown>;
  cost: number;
}

export interface AdCreativeRequest {
  headline: string;
  punchline: string;
  ctaText: string;
  brandColors: [string, string];
  logoUrl?: string;
  productImageUrl?: string;
  size?: '1080x1080' | '1200x628' | '1080x1920';
}

export interface CopyWorkflowRequest {
  workflowId: string;
  inputs: Record<string, string>;
}

export interface RunwayVideoRequest {
  promptText: string;
  promptImage?: string;
  duration?: 5 | 10;
  model?: 'gen3' | 'gen4';
}

export interface SynthesiaVideoRequest {
  script: string;
  avatarId?: string;
  voiceId?: string;
  background?: string;
  test?: boolean;
}

export interface HeyGenVideoRequest {
  script: string;
  avatarId?: string;
  voiceId?: string;
}

// ============================================================================
// AI Tools Client
// ============================================================================

export class AIToolsClient {
  private config: AIToolsConfig;

  constructor(config: AIToolsConfig) {
    this.config = config;
  }

  /**
   * Get status of all available tools
   */
  getAvailableTools(): Record<string, { enabled: boolean; provider: string; cost: string }> {
    return {
      dalle: {
        enabled: !!this.config.openaiApiKey,
        provider: 'OpenAI',
        cost: '$0.04/image',
      },
      adcreative: {
        enabled: !!(this.config.adcreativeApiKey && this.config.adcreativeApiSecret),
        provider: 'AdCreative.ai',
        cost: '$2.50/creative (50 credits @ $125/mo)',
      },
      copyai: {
        enabled: !!this.config.copyaiApiKey,
        provider: 'Copy.ai',
        cost: '$0.01/run (unlimited @ $36/mo)',
      },
      runway: {
        enabled: !!this.config.runwayApiKey,
        provider: 'Runway ML',
        cost: '$0.05/second ($12/mo base)',
      },
      synthesia: {
        enabled: !!this.config.synthesiaApiKey,
        provider: 'Synthesia',
        cost: '$0.60/minute ($18/mo for 30min)',
      },
      heygen: {
        enabled: !!this.config.heygenApiKey,
        provider: 'HeyGen',
        cost: '$0.99/minute ($99/mo for 100 credits)',
      },
    };
  }

  // ==========================================================================
  // DALL-E 3 (OpenAI)
  // ==========================================================================

  async generateDalleImage(prompt: string, options?: {
    size?: '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
  }): Promise<GeneratedImage> {
    if (!this.config.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY.');
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        style: options?.style || 'vivid',
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: { message?: string } };
      throw new Error(`DALL-E error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json() as { data: Array<{ url: string; revised_prompt?: string }> };
    const image = data.data[0];

    return {
      url: image.url,
      provider: 'dalle',
      prompt: image.revised_prompt || prompt,
      metadata: {
        model: 'dall-e-3',
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
      },
      cost: options?.quality === 'hd' ? 0.08 : 0.04,
    };
  }

  // ==========================================================================
  // AdCreative.ai
  // ==========================================================================

  async generateAdCreative(request: AdCreativeRequest): Promise<GeneratedImage> {
    if (!this.config.adcreativeApiKey || !this.config.adcreativeApiSecret) {
      throw new Error('AdCreative.ai credentials not configured. Set ADCREATIVE_API_KEY and ADCREATIVE_API_SECRET.');
    }

    const formData = new FormData();
    formData.append('mainHeadline', request.headline);
    formData.append('punchline', request.punchline);
    formData.append('actionText', request.ctaText);
    formData.append('color1Hex', request.brandColors[0]);
    formData.append('color2Hex', request.brandColors[1]);
    formData.append('renderKind', '1');
    formData.append('renderType', '2');

    if (request.logoUrl) {
      formData.append('logoUrl', request.logoUrl);
    }
    if (request.productImageUrl) {
      formData.append('productImageUrl', request.productImageUrl);
    }

    const response = await fetch('https://api.adcreative.ai/api/v1/Image/Generation/AdCreativesByKind', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.adcreativeBearerToken || ''}`,
        'x-api-key': this.config.adcreativeApiKey,
        'x-api-secret': this.config.adcreativeApiSecret,
      },
      body: formData as any,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AdCreative.ai error: ${error}`);
    }

    const data = await response.json() as { imageUrl?: string; url?: string };

    return {
      url: data.imageUrl || data.url || '',
      provider: 'adcreative',
      metadata: {
        headline: request.headline,
        punchline: request.punchline,
        colors: request.brandColors,
        rawResponse: data as Record<string, unknown>,
      },
      cost: 2.50, // ~50 credits at $125/mo
    };
  }

  // ==========================================================================
  // Copy.ai Workflows
  // ==========================================================================

  async runCopyWorkflow(request: CopyWorkflowRequest): Promise<GeneratedCopy> {
    if (!this.config.copyaiApiKey) {
      throw new Error('Copy.ai API key not configured. Set COPYAI_API_KEY.');
    }

    const response = await fetch(`https://api.copy.ai/v1/workflows/${request.workflowId}/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.copyaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: request.inputs }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Copy.ai error: ${error}`);
    }

    const data = await response.json() as { output?: string; result?: string };

    return {
      text: data.output || data.result || '',
      provider: 'copyai',
      type: 'body',
      metadata: {
        workflowId: request.workflowId,
        inputs: request.inputs,
        rawResponse: data as Record<string, unknown>,
      },
      cost: 0.01, // Effectively free with unlimited plan
    };
  }

  /**
   * Generate ad copy using Copy.ai's standard workflows
   */
  async generateAdCopy(options: {
    productName: string;
    productDescription: string;
    targetAudience: string;
    tone?: string;
  }): Promise<GeneratedCopy[]> {
    if (!this.config.copyaiApiKey) {
      throw new Error('Copy.ai API key not configured. Set COPYAI_API_KEY.');
    }

    // Copy.ai has pre-built workflows for ad copy
    // These workflow IDs are examples - users need to create their own in Copy.ai
    const workflows = [
      { id: 'facebook-ad-copy', type: 'body' as const },
      { id: 'google-ad-headlines', type: 'headline' as const },
      { id: 'ad-cta', type: 'cta' as const },
    ];

    const results: GeneratedCopy[] = [];

    for (const workflow of workflows) {
      try {
        const result = await this.runCopyWorkflow({
          workflowId: workflow.id,
          inputs: {
            product_name: options.productName,
            product_description: options.productDescription,
            target_audience: options.targetAudience,
            tone: options.tone || 'professional',
          },
        });
        result.type = workflow.type;
        results.push(result);
      } catch (e) {
        // Workflow may not exist, continue with others
        console.warn(`Workflow ${workflow.id} not found or failed`);
      }
    }

    return results;
  }

  // ==========================================================================
  // Runway ML (Gen-3/Gen-4)
  // ==========================================================================

  async generateRunwayVideo(request: RunwayVideoRequest): Promise<GeneratedVideo> {
    if (!this.config.runwayApiKey) {
      throw new Error('Runway API key not configured. Set RUNWAY_API_KEY.');
    }

    const endpoint = request.promptImage
      ? 'https://api.runwayml.com/v1/image-to-video'
      : 'https://api.runwayml.com/v1/text-to-video';

    const body: Record<string, unknown> = {
      model: request.model || 'gen4',
      promptText: request.promptText,
      duration: request.duration || 5,
    };

    if (request.promptImage) {
      body.promptImage = request.promptImage;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.runwayApiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runway error: ${error}`);
    }

    const data = await response.json() as { id?: string; taskId?: string };

    return {
      id: data.id || data.taskId || '',
      status: 'processing',
      provider: 'runway',
      duration: request.duration || 5,
      metadata: {
        model: request.model || 'gen4',
        promptText: request.promptText,
        rawResponse: data as Record<string, unknown>,
      },
      cost: (request.duration || 5) * 0.05, // $0.05/second
    };
  }

  /**
   * Check Runway video generation status
   */
  async checkRunwayStatus(taskId: string): Promise<GeneratedVideo> {
    if (!this.config.runwayApiKey) {
      throw new Error('Runway API key not configured.');
    }

    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.runwayApiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
    });

    if (!response.ok) {
      throw new Error(`Runway status check failed: ${response.statusText}`);
    }

    const data = await response.json() as { status: string; output?: { url?: string } };

    return {
      id: taskId,
      status: data.status === 'SUCCEEDED' ? 'completed' : data.status === 'FAILED' ? 'failed' : 'processing',
      url: data.output?.url,
      provider: 'runway',
      metadata: data as Record<string, unknown>,
      cost: 0, // Already charged on creation
    };
  }

  // ==========================================================================
  // Synthesia
  // ==========================================================================

  async generateSynthesiaVideo(request: SynthesiaVideoRequest): Promise<GeneratedVideo> {
    if (!this.config.synthesiaApiKey) {
      throw new Error('Synthesia API key not configured. Set SYNTHESIA_API_KEY.');
    }

    const response = await fetch('https://api.synthesia.io/v2/videos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.synthesiaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: [{
          avatarSettings: {
            avatarId: request.avatarId || 'anna_costume1_cameraA',
            voiceId: request.voiceId,
          },
          scriptText: request.script,
          background: request.background || 'off_white',
        }],
        test: request.test ?? false,
        title: `Monetizer Video ${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Synthesia error: ${error}`);
    }

    const data = await response.json() as { id: string };

    // Estimate duration from script (avg 150 words/minute)
    const wordCount = request.script.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150;

    return {
      id: data.id,
      status: 'processing',
      provider: 'synthesia',
      duration: Math.ceil(estimatedMinutes * 60),
      metadata: {
        avatarId: request.avatarId || 'anna_costume1_cameraA',
        script: request.script,
        rawResponse: data as Record<string, unknown>,
      },
      cost: estimatedMinutes * 0.60, // $0.60/minute
    };
  }

  /**
   * Check Synthesia video status
   */
  async checkSynthesiaStatus(videoId: string): Promise<GeneratedVideo> {
    if (!this.config.synthesiaApiKey) {
      throw new Error('Synthesia API key not configured.');
    }

    const response = await fetch(`https://api.synthesia.io/v2/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.synthesiaApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Synthesia status check failed: ${response.statusText}`);
    }

    const data = await response.json() as { status: string; download?: string; duration?: number };

    return {
      id: videoId,
      status: data.status === 'complete' ? 'completed' : data.status === 'failed' ? 'failed' : 'processing',
      url: data.download,
      provider: 'synthesia',
      duration: data.duration,
      metadata: data as Record<string, unknown>,
      cost: 0, // Already charged on creation
    };
  }

  // ==========================================================================
  // HeyGen
  // ==========================================================================

  async generateHeyGenVideo(request: HeyGenVideoRequest): Promise<GeneratedVideo> {
    if (!this.config.heygenApiKey) {
      throw new Error('HeyGen API key not configured. Set HEYGEN_API_KEY.');
    }

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.heygenApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: request.avatarId || 'josh_lite3_20230714',
          },
          voice: {
            type: 'text',
            input_text: request.script,
            voice_id: request.voiceId || 'en-US-JennyNeural',
          },
        }],
        dimension: { width: 1920, height: 1080 },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HeyGen error: ${error}`);
    }

    const data = await response.json() as { data?: { video_id?: string }; video_id?: string };

    // Estimate duration from script
    const wordCount = request.script.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150;

    return {
      id: data.data?.video_id || data.video_id || '',
      status: 'processing',
      provider: 'heygen',
      duration: Math.ceil(estimatedMinutes * 60),
      metadata: {
        avatarId: request.avatarId,
        script: request.script,
        rawResponse: data as Record<string, unknown>,
      },
      cost: estimatedMinutes * 0.99, // $0.99/minute
    };
  }

  /**
   * Check HeyGen video status
   */
  async checkHeyGenStatus(videoId: string): Promise<GeneratedVideo> {
    if (!this.config.heygenApiKey) {
      throw new Error('HeyGen API key not configured.');
    }

    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.heygenApiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HeyGen status check failed: ${response.statusText}`);
    }

    const data = await response.json() as { data?: { status?: string; video_url?: string; duration?: number } };

    return {
      id: videoId,
      status: data.data?.status === 'completed' ? 'completed' : data.data?.status === 'failed' ? 'failed' : 'processing',
      url: data.data?.video_url,
      provider: 'heygen',
      duration: data.data?.duration,
      metadata: data as Record<string, unknown>,
      cost: 0, // Already charged on creation
    };
  }

  // ==========================================================================
  // Unified Generation Methods
  // ==========================================================================

  /**
   * Generate ad image using best available provider
   */
  async generateAdImage(options: {
    headline: string;
    description: string;
    ctaText: string;
    brandColors?: [string, string];
    style?: 'minimal' | 'bold' | 'professional';
  }): Promise<GeneratedImage> {
    // Try AdCreative.ai first (purpose-built for ads)
    if (this.config.adcreativeApiKey && this.config.adcreativeApiSecret) {
      return this.generateAdCreative({
        headline: options.headline,
        punchline: options.description,
        ctaText: options.ctaText,
        brandColors: options.brandColors || ['#0066FF', '#000000'],
      });
    }

    // Fall back to DALL-E 3
    if (this.config.openaiApiKey) {
      const styleMap = {
        minimal: 'minimalist, clean, white space',
        bold: 'vibrant, eye-catching, high contrast',
        professional: 'corporate, sleek, modern',
      };

      const prompt = `Create a professional advertisement image.
Headline: "${options.headline}"
Style: ${styleMap[options.style || 'professional']}
Colors: ${options.brandColors?.join(', ') || 'blue and black'}
Do not include any text in the image - just the visual design.
Make it suitable for digital advertising.`;

      return this.generateDalleImage(prompt, { size: '1024x1024' });
    }

    throw new Error('No image generation API configured. Set OPENAI_API_KEY or ADCREATIVE_API_KEY.');
  }

  /**
   * Generate promotional video using best available provider
   */
  async generatePromoVideo(options: {
    script: string;
    style?: 'avatar' | 'motion' | 'cinematic';
    sourceImage?: string;
  }): Promise<GeneratedVideo> {
    const style = options.style || 'avatar';

    // Avatar videos - use Synthesia or HeyGen
    if (style === 'avatar') {
      if (this.config.synthesiaApiKey) {
        return this.generateSynthesiaVideo({ script: options.script });
      }
      if (this.config.heygenApiKey) {
        return this.generateHeyGenVideo({ script: options.script });
      }
    }

    // Motion/cinematic videos - use Runway
    if (this.config.runwayApiKey) {
      return this.generateRunwayVideo({
        promptText: options.script,
        promptImage: options.sourceImage,
        duration: 10,
        model: 'gen4',
      });
    }

    throw new Error('No video generation API configured. Set RUNWAY_API_KEY, SYNTHESIA_API_KEY, or HEYGEN_API_KEY.');
  }

  /**
   * Poll for video completion
   */
  async waitForVideo(video: GeneratedVideo, options?: {
    maxWaitMs?: number;
    pollIntervalMs?: number;
    onProgress?: (status: string) => void;
  }): Promise<GeneratedVideo> {
    const maxWait = options?.maxWaitMs || 300000; // 5 minutes
    const pollInterval = options?.pollIntervalMs || 10000; // 10 seconds
    const startTime = Date.now();

    let current = video;

    while (current.status === 'processing' || current.status === 'pending') {
      if (Date.now() - startTime > maxWait) {
        throw new Error(`Video generation timed out after ${maxWait / 1000}s`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));

      if (options?.onProgress) {
        options.onProgress(`Still processing... (${Math.round((Date.now() - startTime) / 1000)}s)`);
      }

      if (current.provider === 'runway') {
        current = await this.checkRunwayStatus(current.id);
      } else if (current.provider === 'synthesia') {
        current = await this.checkSynthesiaStatus(current.id);
      } else if (current.provider === 'heygen') {
        current = await this.checkHeyGenStatus(current.id);
      }
    }

    return current;
  }
}

// ============================================================================
// Factory function
// ============================================================================

export function createAIToolsClient(): AIToolsClient {
  return new AIToolsClient({
    openaiApiKey: process.env.OPENAI_API_KEY,
    adcreativeApiKey: process.env.ADCREATIVE_API_KEY,
    adcreativeApiSecret: process.env.ADCREATIVE_API_SECRET,
    adcreativeBearerToken: process.env.ADCREATIVE_BEARER_TOKEN,
    copyaiApiKey: process.env.COPYAI_API_KEY,
    runwayApiKey: process.env.RUNWAY_API_KEY,
    synthesiaApiKey: process.env.SYNTHESIA_API_KEY,
    heygenApiKey: process.env.HEYGEN_API_KEY,
  });
}

// ============================================================================
// Environment variable reference
// ============================================================================

export const AI_TOOLS_ENV_VARS = {
  OPENAI_API_KEY: {
    description: 'OpenAI API key for DALL-E 3 image generation',
    required: false,
    getUrl: 'https://platform.openai.com/api-keys',
  },
  ADCREATIVE_API_KEY: {
    description: 'AdCreative.ai API key',
    required: false,
    getUrl: 'https://app.adcreative.ai/api',
  },
  ADCREATIVE_API_SECRET: {
    description: 'AdCreative.ai API secret',
    required: false,
    getUrl: 'https://app.adcreative.ai/api',
  },
  COPYAI_API_KEY: {
    description: 'Copy.ai API key for workflow automation',
    required: false,
    getUrl: 'https://app.copy.ai/api',
  },
  RUNWAY_API_KEY: {
    description: 'Runway ML API key for Gen-4 video',
    required: false,
    getUrl: 'https://app.runwayml.com/settings/api',
  },
  SYNTHESIA_API_KEY: {
    description: 'Synthesia API key for avatar videos',
    required: false,
    getUrl: 'https://app.synthesia.io/api',
  },
  HEYGEN_API_KEY: {
    description: 'HeyGen API key for spokesperson videos',
    required: false,
    getUrl: 'https://app.heygen.com/settings/api',
  },
};
