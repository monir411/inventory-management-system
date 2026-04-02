"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numericColumnTransformer = void 0;
exports.numericColumnTransformer = {
    to: (value) => value,
    from: (value) => value === null || value === undefined ? null : Number(value),
};
//# sourceMappingURL=numeric.transformer.js.map