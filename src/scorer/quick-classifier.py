#!/usr/bin/env python3
"""
Quick AI Job Classifier - Lightweight relevance check
Used during scraping to filter ambiguous jobs
Much faster than full scoring
"""

import sys
import json
import os
from dotenv import load_dotenv
load_dotenv()

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class QuickClassifier:
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

    def classify(self, job_title, job_description, company=''):
        """
        Quick binary classification: Is this job relevant for PE2 DevOps/Cloud roles?
        """
        prompt = f"""You are a quick job relevance classifier for Platform Engineering / DevOps / Cloud roles.

Target candidate profile:
- 1.5 years experience
- DevOps / Platform Engineering / Cloud Infrastructure
- Looking for PE2 / Mid-level roles (NOT Senior/Staff/Principal)

Job to evaluate:
Title: {job_title}
Company: {company}
Description: {job_description[:1000]}

Question: Is this job relevant for the target candidate?

Rules for RELEVANT (return true):
- Title includes: Platform Engineer, Cloud Engineer, DevOps, SRE, Infrastructure Engineer
- Level is: Mid-level, PE2, L4, IC2-IC3, Associate, or 1-4 years experience
- Tech stack includes: Kubernetes, Docker, AWS/Azure/GCP, Terraform, CI/CD

Rules for NOT RELEVANT (return false):
- Title includes: Senior, Staff, Principal, Lead, Manager, Architect, Director
- Wrong domain: Data Engineer, ML, Frontend, Mobile, QA, Sales
- Experience: 5+ years, 10+ years
- Contract, Intern, Freelance

Return ONLY this JSON (no markdown, no explanation):
{{
  "relevant": true or false,
  "confidence": 0-100 (how confident are you),
  "reason": "one sentence explanation"
}}"""

        try:
            if self.provider == 'gemini':
                response = self.model.generate_content(
                    prompt,
                    generation_config={
                        'temperature': 0.1,
                        'max_output_tokens': 200  # Very short response
                    }
                )
                result_text = response.text.strip()
            
            elif self.provider == 'openai':
                response = self.client.chat.completions.create(
                    model='gpt-4o-mini',
                    messages=[
                        {'role': 'system', 'content': 'You are a job relevance classifier. Return only JSON.'},
                        {'role': 'user', 'content': prompt}
                    ],
                    temperature=0.1,
                    max_tokens=200
                )
                result_text = response.choices[0].message.content.strip()
            
            # Clean markdown
            if result_text.startswith('```json'):
                result_text = result_text[7:]
            if result_text.startswith('```'):
                result_text = result_text[3:]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
            result_text = result_text.strip()

            result = json.loads(result_text)
            
            # Validate
            if 'relevant' not in result:
                raise ValueError("Missing 'relevant' field")
            
            return result

        except Exception as e:
            # On error, default to relevant (conservative)
            return {
                'relevant': True,
                'confidence': 50,
                'reason': f'Classification error: {str(e)}'
            }


def main():
    if len(sys.argv) < 3:
        print(json.dumps({
            'error': 'Invalid arguments',
            'usage': 'python quick-classifier.py <provider> <job_json>'
        }))
        sys.exit(1)

    provider = sys.argv[1]
    job_data_str = sys.argv[2]

    try:
        job_data = json.loads(job_data_str)
        
        classifier = QuickClassifier(provider=provider)
        result = classifier.classify(
            job_data.get('job_title', ''),
            job_data.get('job_description', ''),
            job_data.get('company', '')
        )
        
        print(json.dumps(result))
        sys.exit(0)
    
    except Exception as e:
        # Default to relevant on error
        print(json.dumps({
            'relevant': True,
            'confidence': 50,
            'reason': f'Error: {str(e)}'
        }))
        sys.exit(0)  # Exit 0 so Node.js doesn't think it failed


if __name__ == '__main__':
    main()
