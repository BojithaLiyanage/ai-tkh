"""
Chatbot service for managing user-specific prompts and context.
Centralizes logic for building personalized chatbot prompts based on user profile.
"""

from typing import Optional, Dict, Any
from app.models.models import User
from app.core.prompts import PromptTemplates, format_onboarding_to_dict


class ChatbotService:
    """Service for managing chatbot interactions with user-specific context"""

    @staticmethod
    def get_user_profile_context(user: User) -> Dict[str, Any]:
        """
        Extract user profile information for prompt customization.

        Args:
            user: User object from database

        Returns:
            Dictionary containing:
            - client_type: User's client type
            - organization: User's organization
            - specialization: User's specialization
            - onboarding_details: User's onboarding answers
            - knowledge_level: User's knowledge level
        """
        profile = {
            "client_type": None,
            "organization": None,
            "specialization": None,
            "onboarding_details": None,
            "knowledge_level": None,
        }

        if user.client:
            profile["client_type"] = user.client.client_type
            profile["organization"] = user.client.organization
            profile["specialization"] = user.client.specialization

            if user.client.onboarding:
                profile["onboarding_details"] = format_onboarding_to_dict(
                    user.client.onboarding.answers
                )
                profile["knowledge_level"] = user.client.onboarding.knowledge_level

        return profile

    @staticmethod
    def build_system_prompt(
        user: User,
        fiber_context: str = "",
        knowledge_base_context: str = "",
        include_user_context: bool = True,
    ) -> str:
        """
        Build complete system prompt for a user, including their profile context.

        Args:
            user: User object
            fiber_context: Fiber database context to include
            knowledge_base_context: Knowledge base context to include
            include_user_context: Whether to include user profile info

        Returns:
            Complete system prompt ready for OpenAI
        """
        # Combine fiber and knowledge base context
        combined_context = ""
        if fiber_context:
            combined_context += fiber_context
        if knowledge_base_context:
            if combined_context:
                combined_context += "\n\n"
            combined_context += knowledge_base_context

        if not include_user_context:
            # Return basic prompt without user customization
            return PromptTemplates.build_complete_system_prompt(fiber_context=combined_context)

        # Get user profile
        profile = ChatbotService.get_user_profile_context(user)

        # Build customized prompt
        return PromptTemplates.build_complete_system_prompt(
            client_type=profile["client_type"],
            organization=profile["organization"],
            specialization=profile["specialization"],
            onboarding_details=profile["onboarding_details"],
            fiber_context=combined_context,
        )

    @staticmethod
    def get_personalization_summary(user: User) -> str:
        """
        Get a human-readable summary of user personalization for debugging/logging.

        Args:
            user: User object

        Returns:
            String describing user's profile
        """
        profile = ChatbotService.get_user_profile_context(user)

        parts = [f"User: {user.full_name}"]

        if profile["client_type"]:
            parts.append(f"- Role: {profile['client_type']}")

        if profile["organization"]:
            parts.append(f"- Organization: {profile['organization']}")

        if profile["specialization"]:
            parts.append(f"- Specialization: {profile['specialization']}")

        if profile["knowledge_level"]:
            parts.append(f"- Knowledge Level: {profile['knowledge_level']}")

        if profile["onboarding_details"]:
            onb = profile["onboarding_details"]
            if onb.get("primary_goal"):
                parts.append(f"- Goal: {onb['primary_goal']}")
            if onb.get("areas_of_interest"):
                interests = ", ".join(onb["areas_of_interest"])
                parts.append(f"- Interests: {interests}")

        return "\n".join(parts)

    @staticmethod
    def should_personalize_for_user(user: User) -> bool:
        """
        Determine if user has enough profile information for personalization.

        Args:
            user: User object

        Returns:
            True if user has at least one customization field filled
        """
        if not user.client:
            return False

        # Check if any personalization field is filled
        has_client_type = user.client.client_type is not None
        has_org = user.client.organization is not None
        has_spec = user.client.specialization is not None
        has_onboarding = user.client.onboarding is not None

        return has_client_type or has_org or has_spec or has_onboarding

    @staticmethod
    def get_recommended_prompt_adjustments(user: User) -> list:
        """
        Get recommendations for how to improve user's prompt customization.

        Args:
            user: User object

        Returns:
            List of recommendations
        """
        recommendations = []
        profile = ChatbotService.get_user_profile_context(user)

        if not profile["client_type"]:
            recommendations.append(
                "Complete profile: Set your role (Researcher, Industry Expert, Student, etc.)"
            )

        if not profile["specialization"]:
            recommendations.append(
                "Add specialization: Specify your focus area (e.g., Sustainable Fibers, Performance Textiles)"
            )

        if not profile["organization"]:
            recommendations.append(
                "Add organization: Help us better understand your context"
            )

        if not profile["onboarding_details"]:
            recommendations.append(
                "Complete onboarding: Tell us about your goals and interests for personalized assistance"
            )

        return recommendations
