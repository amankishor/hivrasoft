import {
  Types,
} from "mongoose";

import Category, {
  ICategoryImage,
} from "../models/Category.model";

import {
  createSlug,
} from "../utils/slug";


/* =========================================================
   TYPES
========================================================= */

export type CreateCategoryInput = {
  name: string;

  description?: string;

  parentId?: string | null;

  image?: ICategoryImage;

  isActive?: boolean;

  sortOrder?: number;
};


export type UpdateCategoryInput = {
  name?: string;

  description?: string;

  parentId?: string | null;

  image?: ICategoryImage;

  isActive?: boolean;

  sortOrder?: number;
};


export type CategoryTreeNode = {
  id: string;

  name: string;

  slug: string;

  description: string;

  parent: string | null;

  ancestors: string[];

  level: number;

  image: {
    url: string;
    publicId: string;
  };

  isActive: boolean;

  sortOrder: number;

  children: CategoryTreeNode[];
};


/* =========================================================
   UNIQUE SLUG
========================================================= */

const generateUniqueSlug =
  async (
    name: string,
    excludeId?: string
  ): Promise<string> => {
    const baseSlug =
      createSlug(name);

    let slug =
      baseSlug;

    let counter =
      2;

    while (true) {
      const query: Record<
        string,
        unknown
      > = {
        slug,
      };

      if (excludeId) {
        query._id = {
          $ne:
            excludeId,
        };
      }

      const existing =
        await Category.findOne(
          query
        )
          .select("_id")
          .lean();

      if (!existing) {
        return slug;
      }

      slug =
        `${baseSlug}-${counter}`;

      counter += 1;
    }
  };


/* =========================================================
   PARENT INFORMATION
========================================================= */

const getParentInformation =
  async (
    parentId?:
      | string
      | null
  ) => {
    if (!parentId) {
      return {
        parent:
          null,

        ancestors:
          [] as Types.ObjectId[],

        level:
          0,
      };
    }

    if (
      !Types.ObjectId.isValid(
        parentId
      )
    ) {
      throw new Error(
        "Invalid parent category ID."
      );
    }

    const parent =
      await Category.findById(
        parentId
      );

    if (!parent) {
      throw new Error(
        "Parent category not found."
      );
    }

    return {
      parent:
        parent._id,

      ancestors: [
        ...parent.ancestors,
        parent._id,
      ] as Types.ObjectId[],

      level:
        parent.level + 1,
    };
  };


/* =========================================================
   CREATE CATEGORY
========================================================= */

export const createCategory =
  async (
    input: CreateCategoryInput
  ) => {
    const name =
      input.name.trim();

    if (!name) {
      throw new Error(
        "Category name is required."
      );
    }

    const slug =
      await generateUniqueSlug(
        name
      );

    const parentInfo =
      await getParentInformation(
        input.parentId
      );

    const category =
      await Category.create({
        name,

        slug,

        description:
          input.description
            ?.trim() ||
          "",

        parent:
          parentInfo.parent,

        ancestors:
          parentInfo.ancestors,

        level:
          parentInfo.level,

        image:
          input.image || {
            url: "",
            publicId: "",
          },

        isActive:
          input.isActive ??
          true,

        sortOrder:
          input.sortOrder ??
          0,
      });

    return category;
  };


/* =========================================================
   GET ALL CATEGORIES
========================================================= */

export const getAllCategories =
  async () => {
    return Category.find()
      .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
      })
      .lean();
  };


/* =========================================================
   GET ACTIVE CATEGORIES
========================================================= */

export const getActiveCategories =
  async () => {
    return Category.find({
      isActive: true,
    })
      .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
      })
      .lean();
  };


/* =========================================================
   GET CATEGORY BY ID
========================================================= */

export const getCategoryById =
  async (
    categoryId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        categoryId
      )
    ) {
      throw new Error(
        "Invalid category ID."
      );
    }

    const category =
      await Category.findById(
        categoryId
      );

    if (!category) {
      throw new Error(
        "Category not found."
      );
    }

    return category;
  };


/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */

export const getCategoryBySlug =
  async (
    slug: string
  ) => {
    const category =
      await Category.findOne({
        slug:
          slug
            .trim()
            .toLowerCase(),
      });

    if (!category) {
      throw new Error(
        "Category not found."
      );
    }

    return category;
  };


/* =========================================================
   REBUILD DESCENDANTS

   Parent category change hone par children ke
   ancestors + level automatically update honge.
========================================================= */

const rebuildDescendants =
  async (
    categoryId: string
  ) => {
    const descendants =
      await Category.find({
        ancestors:
          new Types.ObjectId(
            categoryId
          ),
      }).sort({
        level: 1,
      });

    for (
      const descendant
      of descendants
    ) {
      if (
        !descendant.parent
      ) {
        descendant.ancestors =
          [];

        descendant.level =
          0;

        await descendant.save();

        continue;
      }

      const parent =
        await Category.findById(
          descendant.parent
        );

      if (!parent) {
        continue;
      }

      descendant.ancestors =
        [
          ...parent.ancestors,
          parent._id,
        ] as Types.ObjectId[];

      descendant.level =
        parent.level + 1;

      await descendant.save();
    }
  };


/* =========================================================
   UPDATE CATEGORY
========================================================= */

export const updateCategory =
  async (
    categoryId: string,
    input: UpdateCategoryInput
  ) => {
    if (
      !Types.ObjectId.isValid(
        categoryId
      )
    ) {
      throw new Error(
        "Invalid category ID."
      );
    }

    const category =
      await Category.findById(
        categoryId
      );

    if (!category) {
      throw new Error(
        "Category not found."
      );
    }

    /* NAME */

    if (
      input.name !==
      undefined
    ) {
      const name =
        input.name.trim();

      if (!name) {
        throw new Error(
          "Category name cannot be empty."
        );
      }

      category.name =
        name;

      category.slug =
        await generateUniqueSlug(
          name,
          categoryId
        );
    }


    /* DESCRIPTION */

    if (
      input.description !==
      undefined
    ) {
      category.description =
        input.description.trim();
    }


    /* IMAGE */

    if (
      input.image !==
      undefined
    ) {
      category.image =
        input.image;
    }


    /* ACTIVE */

    if (
      input.isActive !==
      undefined
    ) {
      category.isActive =
        input.isActive;
    }


    /* SORT ORDER */

    if (
      input.sortOrder !==
      undefined
    ) {
      category.sortOrder =
        input.sortOrder;
    }


    /* =====================================
       PARENT CHANGE
    ===================================== */

    let hierarchyChanged =
      false;

    if (
      input.parentId !==
      undefined
    ) {
      if (
        input.parentId ===
        categoryId
      ) {
        throw new Error(
          "Category cannot be its own parent."
        );
      }

      if (
        input.parentId
      ) {
        if (
          !Types.ObjectId.isValid(
            input.parentId
          )
        ) {
          throw new Error(
            "Invalid parent category ID."
          );
        }

        const newParent =
          await Category.findById(
            input.parentId
          );

        if (!newParent) {
          throw new Error(
            "Parent category not found."
          );
        }

        const isDescendant =
          newParent.ancestors.some(
            (
              ancestorId
            ) =>
              String(
                ancestorId
              ) ===
              categoryId
          );

        if (
          isDescendant
        ) {
          throw new Error(
            "A child category cannot become the parent of its own ancestor."
          );
        }

        category.parent =
          newParent._id;

        category.ancestors =
          [
            ...newParent.ancestors,
            newParent._id,
          ] as Types.ObjectId[];

        category.level =
          newParent.level +
          1;
      } else {
        category.parent =
          null;

        category.ancestors =
          [];

        category.level =
          0;
      }

      hierarchyChanged =
        true;
    }

    await category.save();

    if (
      hierarchyChanged
    ) {
      await rebuildDescendants(
        categoryId
      );
    }

    return category;
  };


/* =========================================================
   DELETE CATEGORY
========================================================= */

export const deleteCategory =
  async (
    categoryId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        categoryId
      )
    ) {
      throw new Error(
        "Invalid category ID."
      );
    }

    const category =
      await Category.findById(
        categoryId
      );

    if (!category) {
      throw new Error(
        "Category not found."
      );
    }

    const childCategory =
      await Category.findOne({
        parent:
          category._id,
      })
        .select("_id")
        .lean();

    if (childCategory) {
      throw new Error(
        "Delete or move child categories before deleting this category."
      );
    }

    await Category.deleteOne({
      _id:
        category._id,
    });

    return {
      message:
        "Category deleted successfully.",
    };
  };


/* =========================================================
   CATEGORY TREE
========================================================= */

export const getCategoryTree =
  async (
    activeOnly =
      false
  ): Promise<
    CategoryTreeNode[]
  > => {
    const filter =
      activeOnly
        ? {
            isActive:
              true,
          }
        : {};

    const categories =
      await Category.find(
        filter
      ).sort({
        level: 1,
        sortOrder: 1,
        name: 1,
      });

    const map =
      new Map<
        string,
        CategoryTreeNode
      >();

    const roots:
      CategoryTreeNode[] =
      [];

    for (
      const category
      of categories
    ) {
      const id =
        String(
          category._id
        );

      map.set(id, {
        id,

        name:
          category.name,

        slug:
          category.slug,

        description:
          category.description ||
          "",

        parent:
          category.parent
            ? String(
                category.parent
              )
            : null,

        ancestors:
          category.ancestors.map(
            (
              ancestor
            ) =>
              String(
                ancestor
              )
          ),

        level:
          category.level,

        image: {
          url:
            category.image
              ?.url ||
            "",

          publicId:
            category.image
              ?.publicId ||
            "",
        },

        isActive:
          category.isActive,

        sortOrder:
          category.sortOrder,

        children:
          [],
      });
    }

    for (
      const category
      of categories
    ) {
      const id =
        String(
          category._id
        );

      const node =
        map.get(id);

      if (!node) {
        continue;
      }

      if (
        category.parent
      ) {
        const parentNode =
          map.get(
            String(
              category.parent
            )
          );

        if (parentNode) {
          parentNode.children.push(
            node
          );

          continue;
        }
      }

      roots.push(node);
    }

    return roots;
  };