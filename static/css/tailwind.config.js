tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6',  // Blue for actions
                success: '#10B981',  // Green for pass
                danger: '#EF4444',   // Red for fail
                warning: '#F59E0B',  // Amber for warning
                info: '#60A5FA',     // Light blue for info
            },
            animation: {
                'pulse-slow': 'pulse 3s infinite cubic-bezier(0.4, 0, 0.6, 1)',
            },
            transitionProperty: {
                'height': 'height',
                'spacing': 'margin, padding',
            },
            boxShadow: {
                'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
            }
        }
    },
    plugins: [],
}
