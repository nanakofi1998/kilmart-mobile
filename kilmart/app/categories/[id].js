import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

const Category = () => {
    const router = useRouter();
    const { id } = router.query;
    const [category, setCategory] = useState(null);

    useEffect(() => {
        if (id) {
            fetchCategoryById(id);
        }
    }, [id]);

    const fetchCategoryById = async (categoryId) => {
        try {
            const response = await fetch(`api/categories/${categoryId}`);
            const data = await response.json();
            setCategory(data);
        } catch (error) {
            console.error('Error fetching category:', error);
        }
    };

    if (!category) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>{category.name}</h1>
            <p>{category.description}</p>
        </div>
    );
};

export default Category;