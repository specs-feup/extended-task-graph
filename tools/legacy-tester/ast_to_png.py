import os
import matplotlib.pyplot as plt
from rich.tree import Tree
from rich import print


class AstToPng:
    def __init__(self):
        pass

    def generate_image(self, ast_file):
        if not os.path.exists(ast_file):
            print(f"AST file {ast_file} not found! Aborting PNG generation...")
            return

        contents = ""
        with open(ast_file, "r") as f:
            contents = f.read()

        # tree_structure = self.parse_ast(contents)
        # self.draw_tree(tree_structure)
        self.parse_tree_output(contents)

    def parse_ast(self, contents):
        lines = contents.split("\n")
        tree_structure = []
        for line in lines:
            if ">" not in line:
                continue

            dashes, node_name = line.split(">", 1)
            depth = len(dashes)

            tree_structure.append((depth, node_name))
        return tree_structure

    def draw_tree(self, tree_structure):
        fig, ax = plt.subplots()
        yticks = range(len(tree_structure))
        ax.set_yticks(yticks)
        ax.set_yticklabels([name for _, name in tree_structure])
        for depth, name in tree_structure:
            ax.axhline(yticks[depth], color="gray", linestyle="--")
        plt.show()

    def parse_tree_output(self, tree_output):
        lines = tree_output.split("\n")
        tree = Tree("Root")
        last_node = tree
        predecessor = tree
        last_depth = 0
        for line in lines:
            if ">" not in line:
                continue

            depth = line.split("->")[0].count("-") + 1
            name = line.split("->")[-1].strip()

            predecessor = last_node.add(name)

        print(tree)
