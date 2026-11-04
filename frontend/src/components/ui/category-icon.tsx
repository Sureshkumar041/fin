import { Avatar } from './avatar';

type CategoryIconProps = {
  category: { id: string; name: string };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/** A category's initial on a circle in its stable colour (see lib/category-color). */
export function CategoryIcon({ category, size = 'md', className }: CategoryIconProps) {
  return <Avatar name={category.name} colorKey={category.id} single size={size} className={className} />;
}
