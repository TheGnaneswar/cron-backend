#!/usr/bin/env python3
"""
AI Job Scorer - Python module
Uses Gemini or OpenAI to score jobs against user resume
"""

import sys
import json
import os
from typing import Dict, List, Any

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Import AI providers
try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class JobScorer:
    def __init__(self, provider='gemini'):
        self.provider = provider.lower()
        
        if self.provider == 'gemini':
            if not genai:
                raise ImportError("google-generativeai not installed")
            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                raise ValueError("GEMINI_API_KEY not set")
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        elif self.provider == 'openai':
            if not OpenAI:
                raise ImportError("openai not installed")
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set")
            self.client = OpenAI(api_key=api_key)
        
        else:
            raise ValueError(f"Unknown provider: {provider}")

    def build_prompt(self, resume_json: Dict, job_description: str) -> str:
        """Build the scoring prompt"""
        system_prompt = """You are a job-application decision engine.
Bias toward giving chances to slightly underqualified candidates.
Your goal is maximizing interview callbacks, not perfect matches.
Return STRICT JSON only - no markdown, no explanations."""

        user_prompt = f"""Candidate Experience: 1.5 years (Dev / DevOps)
Target Role Level: PE2 / Mid-level

Resume Profile:
{json.dumps(resume_json, indent=2)}

Job Description:
{job_description}

Compute the following:

1. Skill Match Score (0–100)
   - Ignore years of experience
   - Focus only on tools, stack, responsibilities

2. Role Stretch Score (0–100)
   - 100 = perfect stretch (candidate slightly underqualified but capable)
   - Penalize only if role is clearly senior (staff/principal)

3. Risk-to-Reward Score (0–100)
   - Higher if job is generic, urgent, high-volume hiring
   - Lower if role is niche or leadership-heavy

Return ONLY this JSON (no markdown):
{{
  "skill_match": <number 0-100>,
  "role_stretch": <number 0-100>,
  "risk_reward": <number 0-100>,
  "missing_skills": ["skill1", "skill2"],
  "apply_recommendation": "auto_apply" | "human_review" | "skip",
  "reason": "brief explanation"
}}"""

        return system_prompt, user_prompt

    def score(self, resume_json: Dict, job_description: str) -> Dict:
        """Score a job against a resume"""
        system_prompt, user_prompt = self.build_prompt(resume_json, job_description)

        try:
            if self.provider == 'gemini':
                response = self.model.generate_content(
                    f"{system_prompt}\n\n{user_prompt}",
                    generation_config={
                        'temperature': 0.1,
                        'max_output_tokens': 1000
                    }
                )
                result_text = response.text.strip()
            
            elif self.provider == 'openai':
                response = self.client.chat.completions.create(
                    model='gpt-4o-mini',
                    messages=[
                        {'role': 'system', 'content': system_prompt},
                        {'role': 'user', 'content': user_prompt}
                    ],
                    temperature=0.1,
                    max_tokens=1000
                )
                result_text = response.choices[0].message.content.strip()
            
            # Clean markdown if present
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            # Parse JSON
            score_data = json.loads(result_text)
            
            # Validate required fields
            required_fields = ['skill_match', 'role_stretch', 'risk_reward', 'apply_recommendation']
            for field in required_fields:
                if field not in score_data:
                    raise ValueError(f"Missing required field: {field}")
            
            return score_data

        except json.JSONDecodeError as e:
            return {
                'error': 'Failed to parse AI response',
                'details': str(e),
                'raw_response': result_text[:500]
            }
        except Exception as e:
            return {
                'error': 'Scoring failed',
                'details': str(e)
            }


def main():
    """CLI interface for job scoring"""
    if len(sys.argv) < 4:
        print(json.dumps({
            'error': 'Invalid arguments',
            'usage': 'python scorer.py <provider> <resume_json> <job_description>'
        }))
        sys.exit(1)

    provider = sys.argv[1]
    resume_json_str = sys.argv[2]
    job_description = sys.argv[3]

    try:
        resume_json = json.loads(resume_json_str)
        
        scorer = JobScorer(provider=provider)
        result = scorer.score(resume_json, job_description)
        
        print(json.dumps(result, indent=2))
        sys.exit(0)
    
    except Exception as e:
        print(json.dumps({
            'error': 'Scoring error',
            'details': str(e)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
