export const glossyTableStyles = {
    table: {
        style: {
            backgroundColor: 'transparent',
        },
    },
    headRow: {
        style: {
            backgroundColor: '#f9fafb', // gray-50
            borderBottomWidth: '1px',
            borderBottomColor: '#e5e7eb',
            borderTopLeftRadius: '1rem', // rounded-2xl
            borderTopRightRadius: '1rem',
            minHeight: '56px',
            fontWeight: '600',
            color: '#374151', // gray-700
            fontSize: '0.875rem',
        },
    },
    rows: {
        style: {
            minHeight: '72px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            fontSize: '0.925rem',
            color: '#1f2937', // gray-800
            borderBottomWidth: '1px',
            borderBottomColor: '#f3f4f6',
            '&:hover': {
                backgroundColor: '#fdf2f8', // subtle pink/purple tint on hover
                cursor: 'pointer',
                transition: 'all 0.2s',
            },
        },
    },
    pagination: {
        style: {
            backgroundColor: 'transparent',
            color: '#6b7280',
            borderTopWidth: '1px',
            borderTopColor: '#e5e7eb',
        },
    },
};