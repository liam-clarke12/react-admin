import React, { useEffect, useState } from 'react';
import { Formik, Form, Field } from 'formik';

const MyComponent = () => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        // Simulating an API call
        const fetchData = async () => {
            try {
                const response = await fetch('/api/items'); // Replace with your API endpoint
                const data = await response.json();
                setItems(data || []); // Ensure we set it as an array
            } catch (error) {
                console.error("Error fetching data:", error);
                setItems([]); // Handle the error case by setting an empty array
            }
        };

        fetchData();
    }, []);

    const handleSubmit = (values) => {
        console.log("Form submitted with values:", values);
        // Handle form submission
    };

    return (
        <Formik
            initialValues={{ items }} // Ensure this is defined
            onSubmit={handleSubmit}
        >
            {({ values }) => (
                <Form>
                    {values.items && values.items.length > 0 ? (
                        values.items.map(item => (
                            <div key={item.id}>
                                <label>
                                    {item.name}
                                    <Field name={`items.${item.id}`} placeholder={`Enter value for ${item.name}`} />
                                </label>
                            </div>
                        ))
                    ) : (
                        <p>No items available</p>
                    )}
                    <button type="submit">Submit</button>
                </Form>
            )}
        </Formik>
    );
};

export default MyComponent;
