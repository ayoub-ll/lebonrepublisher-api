class Ad extends Model {
    attributes() {
        return {
            id: {
                type: 'integer',
                primary: true
            },
            title: {
                type: 'string'
            }
        };
    }
}