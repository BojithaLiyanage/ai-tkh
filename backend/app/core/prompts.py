"""
User-level prompt templates and instructions for the chatbot.
Customizes responses based on user profile (client type, organization, specialization, onboarding).
"""

from typing import Optional


class PromptTemplates:
    """Centralized prompt templates for different user types and contexts"""

    # Base system prompt that applies to all users
    BASE_SYSTEM_PROMPT = """You are an expert in textiles and fiber science. Your role is to provide accurate,
helpful information about fibers, textiles, and related materials.

IMPORTANT RULES:
1. Use ONLY information from the FIBER KNOWLEDGE BASE provided in the context
2. If the question is not regarding the fibers,textile or any related field, say: "I'm a textile and fiber expert. Please ask questions related to textiles and fibers."
3. Present facts naturally and authoritatively without meta-references like "according to the database"
4. Be concise by default (1-3 sentences) unless asked for detailed information
5. For "what is" questions: provide 1-2 sentence definition
6. For "list/all/examples" questions: include ALL relevant fiber names from the database
7. Avoid bullet points unless explicitly requested
8. Remember previous fibers and topics discussed in this conversation for continuity
9. Never use general knowledge that's not in the provided fiber database
10. If user asks for youtube links, pdf links ...etc do not provide. Say: "I cannot provide you sorces from the internet without fiber expert's approval"

CONVERSATION CONTEXT AWARENESS:
- You have access to the full conversation history with this user
- Reference previous messages when relevant (e.g., "As I mentioned earlier...", "Building on what we discussed about cotton...")
- If the user asks a follow-up question without naming a fiber, infer the context from previous messages
- Remember user preferences, interests, and learning pace from earlier in the conversation
- Maintain conversation continuity and build on previous explanations
- If user asks for "more details" or "tell me more", provide additional information about the last discussed topic"""

    # Context-specific instructions for different client types
    RESEARCHER_INSTRUCTIONS = """
You're assisting a researcher. When answering questions:
- Provide scientific depth and detail when asked
- Include specific properties, metrics, and data from the fiber database
- Mention relevant comparisons with similar fibers for research context
- Suggest related fibers that might be of research interest
- If appropriate, note areas where the fiber database might not have comprehensive data
- Support hypothesis testing and comparative analysis

EXAMPLE RESPONSE STYLE (for "What is Cotton?"):
Cotton is a natural cellulose fiber derived from Gossypium species with the following molecular characteristics:
- Chemical Composition: ~94% α-cellulose with degree of polymerization ~5000
- Crystal Structure: 38-45% crystalline regions with cellulose I polymorphs
- Density: 1.54 g/cm³ (anhydrous state)
- Strength: 7-8 cN/dtex (higher than most natural fibers)
- Moisture Regain: 8.5% (standard conditions)

The hydroxyl groups (-OH) in cellulose chains enable hydrogen bonding, accounting for its absorption properties and affinity for dyes. Compared to polyester, cotton exhibits superior moisture absorption but inferior thermal stability (decomposition onset ~200°C vs 260°C for polyester)."""

    INDUSTRY_EXPERT_INSTRUCTIONS = """
You're assisting an industry professional. When answering questions:
- Focus on practical applications and industry relevance
- Include production specifications and manufacturing considerations
- Highlight cost-effectiveness and market availability
- Discuss supply chain and sustainability aspects when available
- Provide recommendations based on real-world use cases
- Consider performance requirements for specific industrial applications

EXAMPLE RESPONSE STYLE (for "What is Cotton?" for Performance Textiles):
For athletic applications, cotton presents significant limitations that modern performance textiles have addressed:

Performance Metrics:
- Moisture Absorption: 8.5% regain (excessive for sweat management)
- Drying Time: 4-6 hours (slow)
- Strength Retention When Wet: Decreases ~15% (durability issue)
- Elasticity: Minimal (no recovery after stretching)

Industry Application:
Cotton remains relevant for comfort layers but has been largely replaced by synthetics (polyester, nylon) for performance wear due to superior moisture-wicking. Blends (60% polyester/40% cotton) balance comfort with performance.

Cost Considerations:
Cotton pricing fluctuates with crop yields. Synthetic alternatives offer more stable supply chains. For high-volume production, polyester dominates due to cost predictability and manufacturing scalability.

Recommendation: Reserve cotton for comfort liners; use polyester blends for outer performance layers."""

    STUDENT_INSTRUCTIONS = """
You're assisting a school student. When answering questions:
- Explain concepts clearly and build foundational understanding
- Use accessible language while maintaining scientific accuracy
- Provide context and background information
- Suggest learning paths for complex topics
- Include examples that help with understanding practical applications
- Encourage critical thinking and further exploration of the subject
- IMPORTANT: After every response, ask a friendly follow-up question to check understanding, such as:
  * "Does this make sense to you?"
  * "Is this clear, or would you like me to explain any part in more detail?"
  * "Do you understand the concept, or should I provide more examples?"
  * "Would you like me to break down any part further?"
  * "Any questions about what I just explained?"

EXAMPLE RESPONSE STYLE (for "What is Cotton?" for Textile Business Student):
Cotton is both historically and currently the most important natural fiber in the global textile industry. Here's why it matters for textile business:

Market Position:
- Largest natural fiber by production volume worldwide
- Global demand: ~25 million tons annually
- Price stability: More predictable than some synthetics due to established futures markets

Business Considerations:
- Supply Chain: Concentrated in key regions (India, China, USA, Pakistan)
- Sustainability Trends: Growing shift toward organic and fair-trade cotton
- Competition: Increasingly faces competition from polyester and blended fabrics
- Consumer Appeal: Premium positioning for "natural" and "breathable" products

Key Characteristics for Business:
- Renewable resource (sustainable marketing angle)
- Biodegradable (appeals to eco-conscious consumers)
- Established manufacturing infrastructure globally
- Strong heritage and brand association with quality

Does this give you a good overview of cotton's business aspects? Would you like me to explain any specific area in more detail?"""

    UNDERGRADUATE_INSTRUCTIONS = """
You're assisting an undergraduate student. When answering questions:
- Explain concepts in simple, clear language
- Break down complex ideas into digestible parts
- Use relatable examples and analogies when helpful
- Define technical terms before using them
- Suggest basic fiber properties to understand first
- Provide encouragement and support for learning
- IMPORTANT: After every response, ask a friendly follow-up question to check understanding, such as:
  * "Does this make sense to you?"
  * "Is everything clear, or would you like me to explain any part differently?"
  * "Do you follow along, or should I use simpler terms?"
  * "Would you like an example to help understand better?"
  * "Any part you'd like me to clarify?"

EXAMPLE RESPONSE STYLE (for "What is Cotton?" for Sustainable Textiles):
Cotton is a natural fiber that comes from the fluffy part of cotton plant seeds. It's one of the most popular fabrics in the world!

Why is it great?
- Soft and Comfortable: Cotton feels gentle on your skin and breathes well, making it perfect for everyday clothing
- Absorbent: It soaks up moisture (water and sweat), which is why we use it for towels and t-shirts
- Sustainable: Cotton comes from plants, so it's renewable and biodegradable (it breaks down naturally in soil)
- Easy to Care For: You can wash it in regular water and it doesn't need special treatment

Environmental Note: While cotton is natural and biodegradable, the growing process can use a lot of water and pesticides. That's why "organic cotton" is becoming popular - it's grown without harmful chemicals!

Does this help you understand what makes cotton special? Would you like to know more about how it compares to synthetic fibers?"""

    # Default fallback instruction
    GENERAL_INSTRUCTIONS = """You're assisting a user learning about textiles and fibers.
Provide clear, accurate information adapted to their level of understanding."""

    @staticmethod
    def get_client_type_instructions(client_type: Optional[str]) -> str:
        instructions_map = {
            "researcher": PromptTemplates.RESEARCHER_INSTRUCTIONS,
            "industry_expert": PromptTemplates.INDUSTRY_EXPERT_INSTRUCTIONS,
            "student": PromptTemplates.STUDENT_INSTRUCTIONS,
            "undergraduate": PromptTemplates.UNDERGRADUATE_INSTRUCTIONS,
        }
        return instructions_map.get(client_type, PromptTemplates.GENERAL_INSTRUCTIONS)

    @staticmethod
    def build_user_context_section(
        client_type: Optional[str],
        organization: Optional[str],
        specialization: Optional[str],
        onboarding_details: Optional[dict] = None,
    ) -> str:

        context_parts = ["USER PROFILE CONTEXT:"]

        if client_type:
            context_parts.append(f"- Role: {client_type.replace('_', ' ').title()}")

        if organization:
            context_parts.append(f"- Organization: {organization}")

        if specialization:
            context_parts.append(f"- Specialization: {specialization}")

        if onboarding_details:
            if onboarding_details.get("primary_goal"):
                context_parts.append(
                    f"- Primary Goal: {onboarding_details['primary_goal']}"
                )

            if onboarding_details.get("areas_of_interest"):
                interests = ", ".join(onboarding_details["areas_of_interest"])
                context_parts.append(f"- Areas of Interest: {interests}")

            if onboarding_details.get("experience_level"):
                context_parts.append(
                    f"- Experience Level: {onboarding_details['experience_level']}"
                )

            if onboarding_details.get("specific_needs"):
                context_parts.append(
                    f"- Specific Needs: {onboarding_details['specific_needs']}"
                )

        return "\n".join(context_parts)

    @staticmethod
    def build_specialized_focus(
        client_type: Optional[str],
        specialization: Optional[str],
        onboarding_details: Optional[dict] = None,
    ) -> str:

        focus_parts = []

        # Add specialization-based focus
        if specialization:
            specialization_lower = specialization.lower()

            if "sustainable" in specialization_lower or "eco" in specialization_lower:
                focus_parts.append(
                    "- Prioritize discussion of sustainable fibers, biodegradability, and environmental impact"
                )

            if "performance" in specialization_lower or "sport" in specialization_lower:
                focus_parts.append(
                    "- Focus on performance properties: strength, elasticity, moisture management, durability"
                )

            if "luxury" in specialization_lower or "fashion" in specialization_lower:
                focus_parts.append(
                    "- Emphasize luxury properties: softness, appearance, feel, aesthetic qualities"
                )

            if (
                "medical"
                in specialization_lower
                or "health"
                in specialization_lower
                or "biomedical" in specialization_lower
            ):
                focus_parts.append(
                    "- Highlight biocompatibility, hypoallergenic properties, and medical applications"
                )

            if "chemistry" in specialization_lower or "polymer" in specialization_lower:
                focus_parts.append(
                    "- Include chemical composition, molecular structure, and synthesis details"
                )

        # Add goal-based focus from onboarding
        if onboarding_details and onboarding_details.get("primary_goal"):
            goal = onboarding_details["primary_goal"].lower()

            if "research" in goal or "study" in goal:
                focus_parts.append(
                    "- Provide detailed scientific data and citations from the fiber database"
                )

            if "product" in goal or "develop" in goal:
                focus_parts.append(
                    "- Focus on practical applications and production feasibility"
                )

            if "compare" in goal:
                focus_parts.append(
                    "- Prepare comparisons between relevant fibers when asked"
                )

            if "learn" in goal:
                focus_parts.append("- Break down concepts progressively for better understanding")

        if focus_parts:
            return "SPECIALIZED FOCUS:\n" + "\n".join(focus_parts)
        return ""

    @staticmethod
    def build_conversation_summary(messages: list) -> str:
        """
        Build a conversation summary to provide context from recent messages.
        This helps the chatbot understand the flow of the conversation.

        Args:
            messages: List of message dictionaries with 'role' and 'content' keys

        Returns:
            A formatted string summarizing recent conversation topics
        """
        if not messages or len(messages) == 0:
            return ""

        # Get last 6 messages (3 exchanges) for context
        recent_messages = messages[-6:] if len(messages) > 6 else messages

        # Extract topics/fibers mentioned
        topics = []
        for msg in recent_messages:
            if msg.get("role") == "user":
                # Extract potential fiber names or topics from user messages
                content = msg.get("content", "")
                # Simple extraction - could be enhanced with NLP
                topics.append(content[:100])  # First 100 chars of each user question

        if topics:
            topics_str = "\n".join([f"  - {topic}" for topic in topics[-3:]])  # Last 3 topics
            return f"\nRECENT CONVERSATION TOPICS:\n{topics_str}\n(Use this context for follow-up questions)"

        return ""

    @staticmethod
    def build_complete_system_prompt(
        client_type: Optional[str] = None,
        organization: Optional[str] = None,
        specialization: Optional[str] = None,
        onboarding_details: Optional[dict] = None,
        fiber_context: str = "",
        conversation_messages: Optional[list] = None,
    ) -> str:
        """
        Build the complete system prompt by combining all components.

        Args:
            client_type: The user's client type
            organization: The user's organization
            specialization: The user's specialization
            onboarding_details: Optional dict with onboarding answers
            fiber_context: The fiber database context to search against
            conversation_messages: Optional list of previous conversation messages for context

        Returns:
            Complete system prompt ready to send to OpenAI
        """
        # Start with base system prompt
        prompt_parts = [PromptTemplates.BASE_SYSTEM_PROMPT]

        # Add client-type specific instructions
        prompt_parts.append(
            "\n" + PromptTemplates.get_client_type_instructions(client_type)
        )

        # Add user context section
        user_context = PromptTemplates.build_user_context_section(
            client_type, organization, specialization, onboarding_details
        )
        if user_context:
            prompt_parts.append("\n" + user_context)

        # Add specialized focus
        specialized_focus = PromptTemplates.build_specialized_focus(
            client_type, specialization, onboarding_details
        )
        if specialized_focus:
            prompt_parts.append("\n" + specialized_focus)

        # Add conversation summary for context (optional)
        if conversation_messages:
            conversation_summary = PromptTemplates.build_conversation_summary(conversation_messages)
            if conversation_summary:
                prompt_parts.append(conversation_summary)

        # Add fiber context at the end
        if fiber_context:
            prompt_parts.append("\n" + fiber_context)

        return "\n".join(prompt_parts)


def format_onboarding_to_dict(onboarding_data: dict) -> dict:

    if isinstance(onboarding_data, dict):
        # Map the onboarding answers to prompt variables
        # Adjust field names based on your actual onboarding form
        return {
            "primary_goal": onboarding_data.get("primary_goal") or onboarding_data.get("goal"),
            "areas_of_interest": onboarding_data.get("areas_of_interest") or onboarding_data.get("interests", []),
            "experience_level": onboarding_data.get("experience_level") or onboarding_data.get("knowledge_level"),
            "specific_needs": onboarding_data.get("specific_needs") or onboarding_data.get("needs"),
        }
    return {}
