<?php
if (!defined('ABSPATH')) {
    exit();
}
get_header();
?>
<main class="ly_main">
    <div class="ly_section __m">
        <div class="ly_container __m">
            <?php if (have_posts()): ?>
                <?php while (have_posts()):
                    the_post(); ?>
                    <div class="un_single">
                        <h1 class="un_single_title">
                            <?php the_title(); ?>
                        </h1>
                        <div class="bl_pageContent">
                            <?php the_content(); ?>
                        </div>
                    </div>
                <?php
                endwhile; ?>
            <?php endif; ?>
        </div>
        <!-- /.ly_container -->
    </div>
    <!-- /.ly_section -->
</main>
<!-- /.ly_main -->
<?php get_footer(); ?>
